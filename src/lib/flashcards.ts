import { FlashcardRating, FlashcardStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { cache } from "react";
import { promisify } from "node:util";

import { isDemoModeEnabled } from "./app-config";
import { prisma } from "./db";
import { ensureDemoStudent } from "./student-app";

const execFileAsync = promisify(execFile);

const COMMAND_CANDIDATES = {
  unzip: ["/usr/bin/unzip", "/opt/homebrew/bin/unzip", "/usr/local/bin/unzip", "unzip"],
  sqlite3: [
    "/opt/anaconda3/bin/sqlite3",
    "/opt/homebrew/bin/sqlite3",
    "/usr/local/bin/sqlite3",
    "/usr/bin/sqlite3",
    "sqlite3"
  ],
  zstd: ["/opt/anaconda3/bin/zstd", "/opt/homebrew/bin/zstd", "/usr/local/bin/zstd", "zstd"]
} as const;

export type FlashcardsOverviewData = {
  subjectGroups: Array<{
    subject: string;
    totalDue: number;
    totalCards: number;
    deckCount: number;
    decks: FlashcardsOverviewDeckNode[];
  }>;
  globalState: {
    due: number;
    active: number;
    stable: number;
  };
  reviewDeckId: string | null;
  decksForForms: Array<{
    id: string;
    title: string;
    subject: string;
  }>;
  parentDeckOptions: Array<{
    id: string;
    title: string;
    subject: string;
  }>;
  transferDecks: Array<{
    id: string;
    title: string;
    subject: string;
    isRoot: boolean;
  }>;
  recentShares: Array<{
    id: string;
    shareCode: string;
    title: string;
    createdAtLabel: string;
  }>;
  subjectsForForms: Array<{
    code: string;
    name: string;
  }>;
  browserCards: Array<{
    id: string;
    deckId: string;
    deckTitle: string;
    deckPath: string;
    subject: string;
    frontText: string;
    backText: string;
    nextReviewLabel: string;
    statusLabel: string;
  }>;
};

export type FlashcardsOverviewDeckNode = {
  id: string;
  title: string;
  fullTitle: string;
  subject: string;
  due: number;
  newCards: number;
  retention: number;
  total: number;
  chapter: string;
  isLeaf: boolean;
  depth: number;
  childCount: number;
  children: FlashcardsOverviewDeckNode[];
};

type DeckExportNode = {
  title: string;
  cards: Array<{
    frontText: string;
    backText: string;
    position: number;
    hintText?: string | null;
    tags?: string[];
  }>;
  children: DeckExportNode[];
};

type DeckExportPayload = {
  format: "prepa-flashcards";
  version: 1;
  subjectCode: string;
  rootTitle: string;
  exportedAt: string;
  node: DeckExportNode;
};

export type FlashcardImportResult = {
  ok: boolean;
  source: "json" | "apkg" | "share";
  decksImported: number;
  cardsImported: number;
  message: string;
};

type ReviewOption = {
  value: FlashcardRating;
  label: string;
  nextReviewLabel: string;
};

export type FlashcardDeckData = {
  deck: {
    id: string;
    title: string;
    subject: string;
    chapter: string;
    description: string | null;
  };
  stats: {
    due: number;
    newCards: number;
    retention: number;
    total: number;
    reviewedCards: number;
  };
  reviewCard: {
    id: string;
    frontText: string;
    backText: string;
    tags: string[];
  } | null;
  reviewOptions: ReviewOption[];
  browserCards: Array<{
    id: string;
    frontText: string;
    backText: string;
    nextReviewLabel: string;
    statusLabel: string;
  }>;
};

type ReviewDecision = {
  status: FlashcardStatus;
  nextReviewAt: Date;
  intervalDays: number;
  repetitionCount: number;
  lapseCount: number;
  easeScore: number;
  stabilityScore: number;
  difficultyScore: number;
};

function startOfToday(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addMinutes(date: Date, amount: number) {
  return new Date(date.getTime() + amount * 60_000);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getCurrentIntervalDays(lastReviewAt: Date | null, nextReviewAt: Date | null) {
  if (!lastReviewAt || !nextReviewAt) {
    return 0;
  }

  const diff = nextReviewAt.getTime() - lastReviewAt.getTime();
  return Math.max(0, Math.round(diff / 86_400_000));
}

function getStatusLabel(status: FlashcardStatus | null) {
  if (!status || status === FlashcardStatus.NEW) {
    return "Nouvelle";
  }

  if (status === FlashcardStatus.LEARNING) {
    return "Apprentissage";
  }

  if (status === FlashcardStatus.LAPSED) {
    return "A revoir vite";
  }

  return "Revision";
}

function getNextReviewLabel(nextReviewAt: Date | null, status: FlashcardStatus | null) {
  if (!nextReviewAt || !status || status === FlashcardStatus.NEW) {
    return "Maintenant";
  }

  const today = startOfToday();
  const target = startOfToday(nextReviewAt);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays <= 0) {
    return "Aujourd'hui";
  }

  if (diffDays === 1) {
    return "Demain";
  }

  return `Dans ${diffDays} jours`;
}

function getRetention(reviews: Array<{ rating: FlashcardRating }>) {
  if (reviews.length === 0) {
    return 0;
  }

  const successful = reviews.filter((review) => review.rating !== FlashcardRating.AGAIN).length;
  return Math.round((successful / reviews.length) * 100);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function addHours(date: Date, amount: number) {
  return new Date(date.getTime() + amount * 3_600_000);
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function formatReviewDelay(nextReviewAt: Date) {
  const diffMs = Math.max(0, nextReviewAt.getTime() - Date.now());
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 60) {
    return `${Math.max(1, diffMinutes)} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? "1 h" : `${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) {
    return diffDays === 1 ? "1 j" : `${diffDays} j`;
  }

  const diffMonths = Math.round(diffDays / 30);
  return diffMonths === 1 ? "1 mois" : `${diffMonths} mois`;
}

function getBaseStabilityDays(
  currentStatus: FlashcardStatus | null,
  currentIntervalDays: number,
  repetitionCount: number,
  lapseCount: number,
  storedStabilityScore: number | null
) {
  const intervalBase = currentIntervalDays > 0 ? currentIntervalDays : 0;
  const storedBase = storedStabilityScore && storedStabilityScore > 0 ? storedStabilityScore : 0;
  const earlyLearningBase =
    currentStatus === FlashcardStatus.NEW
      ? 0.35
      : currentStatus === FlashcardStatus.LEARNING
        ? 0.75
        : 1.2;

  return Math.max(intervalBase, storedBase, earlyLearningBase + repetitionCount * 0.2 - lapseCount * 0.05);
}

function getReviewDecision(
  rating: FlashcardRating,
  currentStatus: FlashcardStatus | null,
  repetitionCount: number,
  lapseCount: number,
  currentIntervalDays: number,
  storedStabilityScore: number | null,
  storedDifficultyScore: number | null
): ReviewDecision {
  const now = new Date();
  const difficultyBase = clamp(storedDifficultyScore ?? 0.45, 0.18, 0.92);
  const baseStabilityDays = getBaseStabilityDays(
    currentStatus,
    currentIntervalDays,
    repetitionCount,
    lapseCount,
    storedStabilityScore
  );
  const isEarlyLearning =
    currentStatus === FlashcardStatus.NEW ||
    currentStatus === FlashcardStatus.LEARNING ||
    repetitionCount < 3 ||
    currentIntervalDays < 1;

  if (rating === FlashcardRating.AGAIN) {
    const nextReviewAt =
      currentStatus === FlashcardStatus.REVIEW || currentStatus === FlashcardStatus.LAPSED
        ? isEarlyLearning
          ? addMinutes(now, 10)
          : addMinutes(now, 20)
        : addMinutes(now, 1);

    return {
      status:
        currentStatus === FlashcardStatus.REVIEW || currentStatus === FlashcardStatus.LAPSED
          ? FlashcardStatus.LAPSED
          : FlashcardStatus.LEARNING,
      nextReviewAt,
      intervalDays: Math.max(0, (nextReviewAt.getTime() - now.getTime()) / 86_400_000),
      repetitionCount: 0,
      lapseCount: lapseCount + 1,
      easeScore: 1.15,
      stabilityScore: 0.35,
      difficultyScore: clamp(difficultyBase + 0.15, 0.3, 0.98)
    };
  }

  if (isEarlyLearning) {
    if (rating === FlashcardRating.HARD) {
      const nextReviewAt =
        currentStatus === FlashcardStatus.NEW && repetitionCount === 0
          ? addMinutes(now, 8)
          : repetitionCount <= 1
            ? addMinutes(now, 20)
            : addHours(now, 8);
      return {
        status: FlashcardStatus.LEARNING,
        nextReviewAt,
        intervalDays: (nextReviewAt.getTime() - now.getTime()) / 86_400_000,
        repetitionCount: repetitionCount + 1,
        lapseCount,
        easeScore: 1.5,
        stabilityScore: 0.6,
        difficultyScore: clamp(difficultyBase + 0.05, 0.25, 0.9)
      };
    }

    if (rating === FlashcardRating.MEDIUM) {
      const nextReviewAt =
        currentStatus === FlashcardStatus.NEW && repetitionCount === 0
          ? addMinutes(now, 20)
          : repetitionCount <= 1
            ? addHours(now, 8)
            : addDays(now, 1);
      return {
        status: repetitionCount <= 1 ? FlashcardStatus.LEARNING : FlashcardStatus.REVIEW,
        nextReviewAt,
        intervalDays: (nextReviewAt.getTime() - now.getTime()) / 86_400_000,
        repetitionCount: repetitionCount + 1,
        lapseCount,
        easeScore: 2.1,
        stabilityScore: (nextReviewAt.getTime() - now.getTime()) / 86_400_000,
        difficultyScore: clamp(difficultyBase - 0.04, 0.2, 0.85)
      };
    }

    const nextReviewAt =
      currentStatus === FlashcardStatus.NEW && repetitionCount === 0
        ? addHours(now, 4)
        : repetitionCount <= 1
          ? addDays(now, 1)
          : addDays(now, 3);

    return {
      status: FlashcardStatus.REVIEW,
      nextReviewAt,
      intervalDays: (nextReviewAt.getTime() - now.getTime()) / 86_400_000,
      repetitionCount: repetitionCount + 1,
      lapseCount,
      easeScore: 2.8,
      stabilityScore: (nextReviewAt.getTime() - now.getTime()) / 86_400_000,
      difficultyScore: clamp(difficultyBase - 0.1, 0.18, 0.75)
    };
  }

  const hardMultiplier = clamp(1.25 - difficultyBase * 0.12 + repetitionCount * 0.01, 1.1, 1.45);
  const goodMultiplier = clamp(2.2 - difficultyBase * 0.35 + repetitionCount * 0.03, 1.8, 2.8);
  const easyMultiplier = clamp(3.4 - difficultyBase * 0.45 + repetitionCount * 0.05, 2.6, 4.4);

  if (rating === FlashcardRating.HARD) {
    const intervalDays =
      currentStatus === FlashcardStatus.LAPSED
        ? Math.max(0.5, Math.ceil(baseStabilityDays * 0.2))
        : Math.max(2, Math.ceil(baseStabilityDays * hardMultiplier));

    return {
      status: FlashcardStatus.REVIEW,
      nextReviewAt: intervalDays < 1 ? addHours(now, Math.round(intervalDays * 24)) : addDays(now, intervalDays),
      intervalDays,
      repetitionCount: repetitionCount + 1,
      lapseCount,
      easeScore: hardMultiplier,
      stabilityScore: intervalDays,
      difficultyScore: clamp(difficultyBase + 0.03, 0.2, 0.9)
    };
  }

  if (rating === FlashcardRating.MEDIUM) {
    const intervalDays =
      currentStatus === FlashcardStatus.LAPSED
        ? Math.max(1, Math.ceil(baseStabilityDays * 0.65))
        : Math.max(4, Math.ceil(baseStabilityDays * goodMultiplier));

    return {
      status: FlashcardStatus.REVIEW,
      nextReviewAt: addDays(now, intervalDays),
      intervalDays,
      repetitionCount: repetitionCount + 1,
      lapseCount,
      easeScore: goodMultiplier,
      stabilityScore: intervalDays,
      difficultyScore: clamp(difficultyBase - 0.04, 0.18, 0.82)
    };
  }

  const intervalDays =
    currentStatus === FlashcardStatus.LAPSED
      ? Math.max(3, Math.ceil(baseStabilityDays * 1.15))
      : Math.max(8, Math.ceil(baseStabilityDays * easyMultiplier));

  const nextReviewAt = intervalDays >= 60 ? addMonths(now, Math.round(intervalDays / 30)) : addDays(now, intervalDays);

  return {
    status: FlashcardStatus.REVIEW,
    nextReviewAt,
    intervalDays,
    repetitionCount: repetitionCount + 1,
    lapseCount,
    easeScore: easyMultiplier,
    stabilityScore: intervalDays,
    difficultyScore: clamp(difficultyBase - 0.09, 0.18, 0.72)
  };
}

function getReviewOptions(input: {
  currentStatus: FlashcardStatus | null;
  repetitionCount: number;
  lapseCount: number;
  currentIntervalDays: number;
  storedStabilityScore: number | null;
  storedDifficultyScore: number | null;
}): ReviewOption[] {
  const isEarlyLearning =
    input.currentStatus === FlashcardStatus.NEW ||
    input.currentStatus === FlashcardStatus.LEARNING ||
    input.repetitionCount < 3 ||
    input.currentIntervalDays < 1;

  return [
    { value: FlashcardRating.AGAIN, label: "A revoir" },
    { value: FlashcardRating.HARD, label: "Difficile" },
    { value: FlashcardRating.MEDIUM, label: isEarlyLearning ? "Bien" : "Correct" },
    { value: FlashcardRating.EASY, label: isEarlyLearning ? "Tres facile" : "Facile" }
  ].map((option) => {
    const decision = getReviewDecision(
      option.value,
      input.currentStatus,
      input.repetitionCount,
      input.lapseCount,
      input.currentIntervalDays,
      input.storedStabilityScore,
      input.storedDifficultyScore
    );

    return {
      value: option.value,
      label: option.label,
      nextReviewLabel: formatReviewDelay(decision.nextReviewAt)
    };
  });
}

function createShareCode() {
  return `PREPA-${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function runCommand(
  command: keyof typeof COMMAND_CANDIDATES,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  let lastError: unknown = null;

  for (const candidate of COMMAND_CANDIDATES[command]) {
    try {
      return await execFileAsync(candidate, args);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? error.code : null;
      if (code === "ENOENT") {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error(`Commande introuvable: ${command}`);
}

async function createUniqueShareCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareCode = createShareCode();
    const existing = await prisma.flashcardShare.findUnique({
      where: { shareCode }
    });

    if (!existing) {
      return shareCode;
    }
  }

  return `PREPA-${randomBytes(5).toString("hex").toUpperCase()}`;
}

function sanitizeImportedText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(div|p|span|b|i|strong|em|font|ul|ol|li)[^>]*>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function stripCardHtmlForSearch(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?(div|p|span|b|i|strong|em|font|ul|ol|li|hr|audio|img)[^>]*>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function hasRenderableCardContent(value: string) {
  return Boolean(
    sanitizeImportedText(value) || /<(img|audio|svg)\b/i.test(value)
  );
}

function formatFieldLabel(fieldName: string, value: string) {
  if (!value) {
    return "";
  }

  return fieldName ? `<strong>${fieldName}</strong><br />${value}` : value;
}

function getFallbackCardContent(fieldNames: string[], fieldValues: string[], noteTypeName: string) {
  const nonEmptyFields = fieldValues
    .map((value, index) => ({
      fieldName: fieldNames[index] ?? `Champ ${index + 1}`,
      value
    }))
    .filter((field) => hasRenderableCardContent(field.value));

  const frontText =
    nonEmptyFields[0]?.value ??
    `<div>Carte importee depuis Anki</div><div class="mt-2 text-sm opacity-75">${noteTypeName}</div>`;
  const backText =
    nonEmptyFields.length > 1
      ? nonEmptyFields
          .slice(1)
          .map((field) => formatFieldLabel(field.fieldName, field.value))
          .join("<hr />")
      : formatFieldLabel(nonEmptyFields[0]?.fieldName ?? "", nonEmptyFields[0]?.value ?? frontText);

  return {
    frontText,
    backText
  };
}

function normalizeImportedFieldValue(value: string, mediaPublicPaths: Map<string, string>) {
  return attachApkgMedia(value, mediaPublicPaths)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function readVarint(buffer: Buffer, startOffset: number) {
  let offset = startOffset;
  let result = 0;
  let shift = 0;

  while (offset < buffer.length) {
    const byte = buffer[offset];
    result |= (byte & 0x7f) << shift;
    offset += 1;

    if ((byte & 0x80) === 0) {
      return { value: result, offset };
    }

    shift += 7;
  }

  return { value: result, offset };
}

function parseProtobufMediaMap(buffer: Buffer, availableIndexes: Set<string>) {
  const map = new Map<string, string>();
  let offset = 0;
  let sequenceIndex = 0;

  while (offset < buffer.length) {
    const outerTag = readVarint(buffer, offset);
    offset = outerTag.offset;
    if (outerTag.value !== 10) {
      break;
    }

    const messageLength = readVarint(buffer, offset);
    offset = messageLength.offset;
    const messageEnd = offset + messageLength.value;
    const entryBuffer = buffer.subarray(offset, messageEnd);
    offset = messageEnd;

    let innerOffset = 0;
    let fileName = "";
    let fileIndex = "";

    while (innerOffset < entryBuffer.length) {
      const tag = readVarint(entryBuffer, innerOffset);
      innerOffset = tag.offset;
      const fieldNumber = tag.value >> 3;
      const wireType = tag.value & 0x7;

      if (wireType === 2) {
        const lengthField = readVarint(entryBuffer, innerOffset);
        innerOffset = lengthField.offset;
        const fieldBuffer = entryBuffer.subarray(innerOffset, innerOffset + lengthField.value);
        innerOffset += lengthField.value;

        if (fieldNumber === 1) {
          fileName = fieldBuffer.toString("utf8");
        }
      } else if (wireType === 0) {
        const valueField = readVarint(entryBuffer, innerOffset);
        innerOffset = valueField.offset;
        if (fieldNumber === 2) {
          fileIndex = String(valueField.value);
        }
      } else {
        break;
      }
    }

    if (fileName) {
      const resolvedIndex = fileIndex && availableIndexes.has(fileIndex) ? fileIndex : String(sequenceIndex);
      map.set(fileName, resolvedIndex);
      sequenceIndex += 1;
    }
  }

  return map;
}

async function getApkgMediaNameToIndex(workdir: string) {
  const mediaPath = path.join(workdir, "media");
  if (!existsSync(mediaPath)) {
    return new Map<string, string>();
  }

  const rawMediaPath = path.join(workdir, "media.raw");

  try {
    await runCommand("zstd", ["-d", "-q", "-f", "-o", rawMediaPath, mediaPath]);
  } catch {
    const rawBuffer = await readFile(mediaPath);
    await writeFile(rawMediaPath, rawBuffer);
  }

  const mediaBuffer = await readFile(rawMediaPath);
  const availableIndexes = new Set(
    (await readdir(workdir)).filter((entry) => /^\d+$/.test(entry))
  );

  const trimmed = mediaBuffer.toString("utf8").trim();
  if (trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed) as Record<string, string>;
    return new Map(Object.entries(parsed).map(([index, name]) => [name, index]));
  }

  return parseProtobufMediaMap(mediaBuffer, availableIndexes);
}

function inferMimeType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".gif") {
    return "image/gif";
  }

  if (extension === ".svg") {
    return "image/svg+xml";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  if (extension === ".mp3") {
    return "audio/mpeg";
  }

  if (extension === ".wav") {
    return "audio/wav";
  }

  return "application/octet-stream";
}

async function extractApkgMediaFiles(workdir: string) {
  const nameToIndex = await getApkgMediaNameToIndex(workdir);
  const publicFolder = path.join(process.cwd(), "public", "uploads", "anki-media", Date.now().toString());
  const mediaPublicPaths = new Map<string, string>();

  if (nameToIndex.size === 0) {
    return mediaPublicPaths;
  }

  await mkdir(publicFolder, { recursive: true });

  for (const [originalName, index] of nameToIndex.entries()) {
    const sourcePath = path.join(workdir, index);
    if (!existsSync(sourcePath)) {
      continue;
    }

    const extension = path.extname(originalName) || ".bin";
    const safeFileName = `${index}-${sanitizeFileName(path.basename(originalName, extension))}${extension.toLowerCase()}`;
    const targetAbsolutePath = path.join(publicFolder, safeFileName);

    try {
      await runCommand("zstd", ["-d", "-q", "-f", "-o", targetAbsolutePath, sourcePath]);
    } catch {
      const sourceBuffer = await readFile(sourcePath);
      await writeFile(targetAbsolutePath, sourceBuffer);
    }

    mediaPublicPaths.set(
      originalName,
      `/uploads/anki-media/${path.basename(publicFolder)}/${safeFileName}`.replaceAll(path.sep, "/")
    );
  }

  return mediaPublicPaths;
}

function attachApkgMedia(html: string, mediaPublicPaths: Map<string, string>) {
  let next = html;

  for (const [originalName, publicPath] of mediaPublicPaths.entries()) {
    const escapedOriginalName = originalName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sourcePattern = new RegExp(`(["'(])${escapedOriginalName}(["')])`, "g");
    next = next.replace(sourcePattern, `$1${publicPath}$2`);
    next = next.replace(
      new RegExp(`\\[sound:${escapedOriginalName.replace(/\./g, "\\.")}\\]`, "g"),
      `<audio controls src="${publicPath}"></audio>`
    );
  }

  return next;
}

function renderAnkiClozeFace(text: string, cardOrd: number, revealAnswer: boolean) {
  const targetIndex = cardOrd + 1;
  return text.replace(/\{\{c(\d+)::(.*?)(?:::(.*?))?\}\}/g, (_, rawIndex, content, hint) => {
    const clozeIndex = Number(rawIndex);
    if (Number.isNaN(clozeIndex)) {
      return content;
    }

    if (revealAnswer) {
      return content;
    }

    if (clozeIndex === targetIndex) {
      const placeholder = hint ? `[${hint}]` : "[...]";
      return `<span class="rounded-md bg-clay/15 px-2 py-1 text-clay">${placeholder}</span>`;
    }

    return content;
  });
}

function buildClozeCardContent(text: string, extra: string, cardOrd: number) {
  const frontText = renderAnkiClozeFace(text, cardOrd, false);
  const answerText = renderAnkiClozeFace(text, cardOrd, true);

  return {
    frontText,
    backText: extra ? `${answerText}<hr />${extra}` : answerText
  };
}

function buildBasicCardContent(
  fieldMap: Map<string, string>,
  fieldValues: string[],
  fieldNames: string[],
  cardOrd: number,
  templateName: string,
  noteTypeName: string
) {
  const front =
    fieldMap.get("Front") ??
    fieldMap.get("Recto") ??
    fieldValues[0] ??
    "";
  const back =
    fieldMap.get("Back") ??
    fieldMap.get("Verso") ??
    fieldValues[1] ??
    "";
  const reverseSignals = [
    templateName.toLowerCase().includes("2"),
    noteTypeName.toLowerCase().includes("reverse"),
    noteTypeName.toLowerCase().includes("deux sens"),
    noteTypeName.toLowerCase().includes("reversed"),
    noteTypeName.toLowerCase().includes("deux-sens")
  ];

  const shouldReverse = cardOrd > 0 && reverseSignals.some(Boolean);
  const primaryCard = shouldReverse
    ? { frontText: back, backText: front }
    : { frontText: front, backText: back };

  if (
    hasRenderableCardContent(primaryCard.frontText) &&
    hasRenderableCardContent(primaryCard.backText)
  ) {
    return primaryCard;
  }

  return getFallbackCardContent(fieldNames, fieldValues, noteTypeName);
}

function buildImageOcclusionCardContent(fieldMap: Map<string, string>) {
  const header = fieldMap.get("Header") ?? "Image a retenir";
  const image = fieldMap.get("Image") ?? "";
  const backExtra = fieldMap.get("Back Extra") ?? "";
  const comments = fieldMap.get("Comments") ?? "";
  const question =
    `${header}${image ? `<div class="mt-4">${image}</div>` : ""}<div class="mt-4">Trouve la zone masquee.</div>`;
  const answerParts = [image, backExtra, comments].filter(Boolean);

  return {
    frontText: question,
    backText: answerParts.join("<hr />") || header
  };
}

function buildAnkiCardFromRow(input: {
  noteTypeName: string;
  templateName: string;
  cardOrd: number;
  fieldNames: string[];
  rawFields: string;
  mediaPublicPaths: Map<string, string>;
}) {
  const rawFieldValues = input.rawFields.split("\u001f");
  const fieldValues = rawFieldValues.map((field) =>
    normalizeImportedFieldValue(field, input.mediaPublicPaths)
  );
  const fieldMap = new Map(input.fieldNames.map((fieldName, index) => [fieldName, fieldValues[index] ?? ""]));
  const normalizedFieldNames = input.fieldNames.map((fieldName) => fieldName.toLowerCase());

  if (normalizedFieldNames.includes("texte") || normalizedFieldNames.includes("text")) {
    const text = fieldMap.get("Texte") ?? fieldMap.get("Text") ?? fieldValues[0] ?? "";
    const extra = fieldMap.get("Extra") ?? fieldMap.get("Back Extra") ?? "";
    const clozeCard = buildClozeCardContent(text, extra, input.cardOrd);

    return {
      ...(
        hasRenderableCardContent(clozeCard.frontText) && hasRenderableCardContent(clozeCard.backText)
          ? clozeCard
          : getFallbackCardContent(input.fieldNames, fieldValues, input.noteTypeName)
      ),
      tags: ["anki", "anki:cloze", `anki:template:${input.templateName || "cloze"}`],
      hintText: input.noteTypeName
    };
  }

  if (normalizedFieldNames.includes("image") || normalizedFieldNames.includes("occlusion")) {
    const imageOcclusionCard = buildImageOcclusionCardContent(fieldMap);

    return {
      ...(
        hasRenderableCardContent(imageOcclusionCard.frontText) &&
        hasRenderableCardContent(imageOcclusionCard.backText)
          ? imageOcclusionCard
          : getFallbackCardContent(input.fieldNames, fieldValues, input.noteTypeName)
      ),
      tags: ["anki", "anki:image-occlusion", `anki:template:${input.templateName || "image"}`],
      hintText: input.noteTypeName
    };
  }

  const basicCard = buildBasicCardContent(
    fieldMap,
    fieldValues,
    input.fieldNames,
    input.cardOrd,
    input.templateName,
    input.noteTypeName
  );

  const extraFields = input.fieldNames
    .slice(2)
    .map((fieldName, index) => {
      const value = fieldValues[index + 2] ?? "";
      return value ? `<strong>${fieldName}</strong><br />${value}` : "";
    })
    .filter(Boolean);

  return {
    frontText: basicCard.frontText,
    backText:
      extraFields.length > 0 &&
      !extraFields.every((value) => basicCard.backText.includes(value))
        ? `${basicCard.backText}<hr />${extraFields.join("<hr />")}`
        : basicCard.backText,
    tags: ["anki", `anki:template:${input.templateName || "basic"}`],
    hintText: input.noteTypeName
  };
}

async function buildDeckExportNode(deckId: string): Promise<DeckExportNode | null> {
  const deck = await prisma.flashcardDeck.findUnique({
    where: { id: deckId },
    include: {
      flashcards: {
        orderBy: { position: "asc" }
      },
      childDecks: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!deck) {
    return null;
  }

  const children = (
    await Promise.all(deck.childDecks.map((childDeck) => buildDeckExportNode(childDeck.id)))
  ).filter((child): child is DeckExportNode => Boolean(child));

  return {
    title: deck.title,
    cards: deck.flashcards.map((card) => ({
      frontText: card.frontText,
      backText: card.backText,
      position: card.position,
      hintText: card.hintText,
      tags: Array.isArray(card.tags) ? card.tags.map(String) : []
    })),
    children
  };
}

async function createDeckFromNode(input: {
  ownerUserId: string;
  classId: string | null;
  subjectId: string;
  node: DeckExportNode;
  parentDeckId?: string | null;
}) {
  const deck = await prisma.flashcardDeck.create({
    data: {
      ownerUserId: input.ownerUserId,
      classId: input.classId,
      subjectId: input.subjectId,
      parentDeckId: input.parentDeckId ?? null,
      title: input.node.title,
      description: null,
      createdByType: "MANUAL"
    }
  });

  if (input.node.cards.length > 0) {
    await prisma.flashcard.createMany({
      data: input.node.cards.map((card, index) => ({
        deckId: deck.id,
        frontText: card.frontText.trim(),
        backText: card.backText.trim(),
        hintText: card.hintText ?? null,
        tags: card.tags ?? undefined,
        position: card.position || index + 1
      }))
    });
  }

  for (const childNode of input.node.children) {
    await createDeckFromNode({
      ownerUserId: input.ownerUserId,
      classId: input.classId,
      subjectId: input.subjectId,
      node: childNode,
      parentDeckId: deck.id
    });
  }

  return deck.id;
}

function countNodeStats(node: DeckExportNode): { decks: number; cards: number } {
  return node.children.reduce(
    (totals, childNode) => {
      const childTotals = countNodeStats(childNode);
      return {
        decks: totals.decks + childTotals.decks,
        cards: totals.cards + childTotals.cards
      };
    },
    {
      decks: 1,
      cards: node.cards.length
    }
  );
}

async function buildExportPayload(deckId: string): Promise<DeckExportPayload | null> {
  const deck = await prisma.flashcardDeck.findUnique({
    where: { id: deckId },
    include: {
      subject: true
    }
  });

  if (!deck) {
    return null;
  }

  const node = await buildDeckExportNode(deckId);
  if (!node) {
    return null;
  }

  return {
    format: "prepa-flashcards",
    version: 1,
    subjectCode: deck.subject.code,
    rootTitle: deck.title,
    exportedAt: new Date().toISOString(),
    node
  };
}

async function importExportPayload(
  payload: DeckExportPayload,
  userId: string,
  classId: string | null
): Promise<{ decksImported: number; cardsImported: number; error?: string }> {
  if (payload.format !== "prepa-flashcards" || payload.version !== 1) {
    return {
      decksImported: 0,
      cardsImported: 0,
      error: "Le format du deck n'est pas reconnu."
    };
  }

  const subject = await prisma.subject.findUnique({
    where: { code: payload.subjectCode }
  });

  if (!subject) {
    return {
      decksImported: 0,
      cardsImported: 0,
      error: "La matiere du deck n'a pas ete reconnue."
    };
  }

  await createDeckFromNode({
    ownerUserId: userId,
    classId,
    subjectId: subject.id,
    node: payload.node
  });

  const stats = countNodeStats(payload.node);
  return {
    decksImported: stats.decks,
    cardsImported: stats.cards
  };
}

async function findCollectionDb(workdir: string) {
  const entries = await readdir(workdir, { recursive: true });
  const dbEntry = entries.find((entry) => /collection\.anki2(1b?|)\b/i.test(String(entry)));
  return dbEntry ? path.join(workdir, String(dbEntry)) : null;
}

function splitAnkiDeckPath(deckName: string) {
  return deckName
    .split(/::|\u001f/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function decodeHexSqliteText(value: string) {
  if (!value) {
    return "";
  }

  return Buffer.from(value, "hex").toString("utf8");
}

async function resolveReadableApkgDbPath(workdir: string) {
  const compressedCandidates = ["collection.anki21b"]
    .map((candidate) => path.join(workdir, candidate))
    .filter((candidate) => existsSync(candidate));

  if (compressedCandidates.length > 0) {
    const readableDbPath = path.join(workdir, "collection.readable.sqlite");
    await runCommand("zstd", ["-d", "-q", "-f", "-o", readableDbPath, compressedCandidates[0]]);
    return readableDbPath;
  }

  const directCandidates = ["collection.anki21", "collection.anki2"]
    .map((candidate) => path.join(workdir, candidate))
    .filter((candidate) => existsSync(candidate));

  if (directCandidates.length > 0) {
    return directCandidates[0];
  }

  return findCollectionDb(workdir);
}

async function readApkgAsExportPayload(
  file: File
): Promise<{ payloads: DeckExportPayload[]; warning?: string }> {
  const sqliteSeparator = "\u001d";
  const workdir = await mkdtemp(path.join(tmpdir(), "prepa-apkg-"));
  const archivePath = path.join(workdir, file.name || "deck.apkg");
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(archivePath, buffer);

  try {
    await runCommand("unzip", ["-qq", archivePath, "-d", workdir]);

    const selectedDbPath = await resolveReadableApkgDbPath(workdir);

    if (!selectedDbPath) {
      return {
        payloads: [],
        warning: "Aucune base Anki n'a ete trouvee dans ce fichier `.apkg`."
      };
    }

    const deckRegistry = new Map<string, string>();

    try {
      const { stdout: modernDecksStdout } = await runCommand("sqlite3", [
        "-separator",
        "\t",
        selectedDbPath,
        "select id, hex(name) from decks;"
      ]);

      for (const line of modernDecksStdout.split(/\r?\n/)) {
        if (!line.trim()) {
          continue;
        }

        const separatorIndex = line.indexOf("\t");
        const deckId = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
        const encodedDeckName = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : "";
        const deckName = decodeHexSqliteText(encodedDeckName);
        if (deckId && deckName) {
          deckRegistry.set(deckId, deckName);
        }
      }
    } catch {
      const { stdout: legacyDecksStdout } = await runCommand("sqlite3", [
        selectedDbPath,
        "select decks from col;"
      ]);
      const rawDecks = legacyDecksStdout.trim();
      if (rawDecks) {
        const legacyDeckRegistry = JSON.parse(rawDecks) as Record<string, { name?: string }>;
        for (const [deckId, deckConfig] of Object.entries(legacyDeckRegistry)) {
          if (deckConfig?.name) {
            deckRegistry.set(deckId, deckConfig.name);
          }
        }
      }
    }

    if (deckRegistry.size === 0) {
      return {
        payloads: [],
        warning: "Le fichier `.apkg` ne contient pas de decks exploitables."
      };
    }

    const mediaPublicPaths = await extractApkgMediaFiles(workdir);

    const { stdout: fieldNamesStdout } = await runCommand("sqlite3", [
      "-separator",
      sqliteSeparator,
      selectedDbPath,
      "select ntid, ord, hex(name) from fields order by ntid, ord;"
    ]);
    const fieldNamesByNoteType = new Map<string, string[]>();

    for (const line of fieldNamesStdout.split(/\r?\n/)) {
      if (!line.trim()) {
        continue;
      }

      const [noteTypeId, rawOrd = "0", encodedFieldName = ""] = line.split(sqliteSeparator);
      const ord = Number(rawOrd);
      const existing = fieldNamesByNoteType.get(noteTypeId) ?? [];
      existing[ord] = decodeHexSqliteText(encodedFieldName);
      fieldNamesByNoteType.set(noteTypeId, existing);
    }

    const { stdout: noteTypesStdout } = await runCommand("sqlite3", [
      "-separator",
      sqliteSeparator,
      selectedDbPath,
      "select id, hex(name) from notetypes;"
    ]);
    const noteTypeNames = new Map<string, string>();

    for (const line of noteTypesStdout.split(/\r?\n/)) {
      if (!line.trim()) {
        continue;
      }

      const separatorIndex = line.indexOf(sqliteSeparator);
      const noteTypeId = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
      const encodedNoteTypeName = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : "";
      const noteTypeName = decodeHexSqliteText(encodedNoteTypeName);
      if (noteTypeId) {
        noteTypeNames.set(noteTypeId, noteTypeName);
      }
    }

    const { stdout: cardsStdout } = await runCommand("sqlite3", [
      "-separator",
      sqliteSeparator,
      selectedDbPath,
      "select cards.did, cards.ord, notes.mid, hex(notes.flds), hex(ifnull(templates.name, '')) from cards join notes on notes.id = cards.nid left join templates on templates.ntid = notes.mid and templates.ord = cards.ord order by cards.did, cards.id;"
    ]);

    const cardsByDeck = new Map<
      string,
      Array<{
        frontText: string;
        backText: string;
        tags: string[];
        hintText: string | null;
      }>
    >();
    let skippedNotes = 0;

    for (const line of cardsStdout.split(/\r?\n/)) {
      if (!line.trim()) {
        continue;
      }

      const [
        deckId = "",
        rawOrd = "0",
        noteTypeId = "",
        encodedFields = "",
        encodedTemplateName = ""
      ] =
        line.split(sqliteSeparator);

      const fieldNames = fieldNamesByNoteType.get(noteTypeId) ?? [];
      const noteTypeName = noteTypeNames.get(noteTypeId) ?? "Anki";
      const card = buildAnkiCardFromRow({
        noteTypeName,
        templateName: decodeHexSqliteText(encodedTemplateName),
        cardOrd: Number(rawOrd),
        fieldNames,
        rawFields: decodeHexSqliteText(encodedFields),
        mediaPublicPaths
      });

      if (!hasRenderableCardContent(card.frontText) || !hasRenderableCardContent(card.backText)) {
        skippedNotes += 1;
        continue;
      }

      const existing = cardsByDeck.get(deckId) ?? [];
      existing.push(card);
      cardsByDeck.set(deckId, existing);
    }

    type MutableDeckNode = {
      title: string;
      cards: DeckExportNode["cards"];
      children: Map<string, MutableDeckNode>;
    };

    const rootNodes = new Map<string, MutableDeckNode>();

    const ensureChildNode = (parent: MutableDeckNode, title: string) => {
      const existing = parent.children.get(title);
      if (existing) {
        return existing;
      }

      const next: MutableDeckNode = {
        title,
        cards: [],
        children: new Map()
      };
      parent.children.set(title, next);
      return next;
    };

    for (const [deckId, cards] of cardsByDeck.entries()) {
      const deckName = deckRegistry.get(deckId) ?? `Deck ${deckId}`;
      const parts = splitAnkiDeckPath(deckName);
      const normalizedParts = parts.length > 0 ? parts : [deckName];
      const [rootTitle, ...childParts] = normalizedParts;

      let rootNode = rootNodes.get(rootTitle);
      if (!rootNode) {
        rootNode = {
          title: rootTitle,
          cards: [],
          children: new Map()
        };
        rootNodes.set(rootTitle, rootNode);
      }

      let currentNode = rootNode;
      for (const part of childParts) {
        currentNode = ensureChildNode(currentNode, part);
      }

      currentNode.cards.push(
        ...cards.map((card, index) => ({
          frontText: card.frontText,
          backText: card.backText,
          hintText: card.hintText,
          tags: card.tags,
          position: currentNode.cards.length + index + 1
        }))
      );
    }

    const toExportNode = (node: MutableDeckNode): DeckExportNode => ({
      title: node.title,
      cards: node.cards,
      children: Array.from(node.children.values())
        .map(toExportNode)
        .sort((left, right) => left.title.localeCompare(right.title, "fr"))
    });

    const payloads: DeckExportPayload[] = Array.from(rootNodes.values()).map((rootNode) => {
      const subjectHint = rootNode.title.toUpperCase();
      const subjectCode =
        ["MATHS", "ESH", "HGG", "CG", "ANG"].find((code) => subjectHint.includes(code)) ?? "MATHS";

      return {
        format: "prepa-flashcards" as const,
        version: 1 as const,
        subjectCode,
        rootTitle: rootNode.title,
        exportedAt: new Date().toISOString(),
        node: toExportNode(rootNode)
      };
    });

    const importedCards = payloads.reduce(
      (total, payload) => total + countNodeStats(payload.node).cards,
      0
    );

    if (payloads.length === 0 || importedCards === 0) {
      return {
        payloads: [],
        warning:
          "Aucune carte exploitable n'a ete detectee dans ce deck Anki."
      };
    }

    return {
      payloads,
      warning:
        skippedNotes > 0
          ? `${skippedNotes} cartes n'ont pas pu etre converties automatiquement.`
          : undefined
    };
  } catch (error) {
    console.error("APKG import parsing failed", error);
    return {
      payloads: [],
      warning: "Le fichier `.apkg` n'a pas pu etre lu correctement."
    };
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

export const ensureDemoFlashcards = cache(async () => {
  const { user, prepClass } = await ensureDemoStudent();
  if (!isDemoModeEnabled()) {
    return { user, prepClass };
  }

  const existingDecks = await prisma.flashcardDeck.count({
    where: { ownerUserId: user.id }
  });

  if (existingDecks > 0) {
    return { user, prepClass };
  }

  const subjects = await prisma.subject.findMany({
    where: {
      code: {
        in: ["MATHS", "ESH", "HGG"]
      }
    }
  });

  const subjectMap = new Map(subjects.map((subject) => [subject.code, subject]));

  const seededDecks = [
    {
      parentTitle: "Maths",
      title: "Lois usuelles",
      description: "Definitions, formules et reflexes de probabilites",
      subjectCode: "MATHS",
      cards: [
        ["Definition d'une variable aleatoire discrete", "Une variable aleatoire discrete prend un nombre fini ou denombrable de valeurs."],
        ["Esperance d'une loi binomiale B(n,p)", "E(X) = n x p"],
        ["Variance d'une loi binomiale B(n,p)", "V(X) = n x p x (1-p)"],
        ["Condition d'usage d'une loi de Poisson", "Approximation d'une binomiale avec n grand, p petit et np modere."]
      ]
    },
    {
      parentTitle: "ESH",
      title: "Auteurs de la croissance",
      description: "References courtes et mobilisables en dissertation ESH",
      subjectCode: "ESH",
      cards: [
        ["Solow", "Modele de croissance exogene avec progres technique exogene et rendements decroissants du capital."],
        ["Romer", "Croissance endogene portee par les idees, la R&D et les externalites de connaissance."],
        ["Lucas", "Role central du capital humain dans la croissance endogene."],
        ["Schumpeter", "Innovation, destruction creatrice et dynamique capitaliste."]
      ]
    },
    {
      parentTitle: "HGG",
      title: "Dates a haut rendement",
      description: "Repères HGG utiles en colle et dissertation",
      subjectCode: "HGG",
      cards: [
        ["1944", "Accords de Bretton Woods."],
        ["1971", "Fin de la convertibilite dollar-or par Nixon."],
        ["1989", "Chute du mur de Berlin."],
        ["2001", "Entree de la Chine a l'OMC."]
      ]
    }
  ] as const;

  for (const seededDeck of seededDecks) {
    const subject = subjectMap.get(seededDeck.subjectCode);
    if (!subject) {
      continue;
    }

    const parentDeck = await prisma.flashcardDeck.create({
      data: {
        ownerUserId: user.id,
        classId: prepClass.id,
        subjectId: subject.id,
        title: seededDeck.parentTitle,
        description: null,
        createdByType: "MANUAL"
      }
    });

    const deck = await prisma.flashcardDeck.create({
      data: {
        ownerUserId: user.id,
        classId: prepClass.id,
        subjectId: subject.id,
        parentDeckId: parentDeck.id,
        title: seededDeck.title,
        description: seededDeck.description,
        createdByType: "MANUAL"
      }
    });

    await prisma.flashcard.createMany({
      data: seededDeck.cards.map(([frontText, backText], index) => ({
        deckId: deck.id,
        frontText,
        backText,
        position: index + 1
      }))
    });
  }

  return { user, prepClass };
});

export async function getFlashcardExportPayload(deckId: string) {
  const { user } = await ensureDemoFlashcards();
  const deck = await prisma.flashcardDeck.findFirst({
    where: {
      id: deckId,
      ownerUserId: user.id
    }
  });

  if (!deck) {
    return null;
  }

  return buildExportPayload(deck.id);
}

export async function createFlashcardShare(deckId: string) {
  const { user } = await ensureDemoFlashcards();
  const deck = await prisma.flashcardDeck.findFirst({
    where: {
      id: deckId,
      ownerUserId: user.id
    }
  });

  if (!deck) {
    return null;
  }

  const payload = await buildExportPayload(deck.id);
  if (!payload) {
    return null;
  }

  const shareCode = await createUniqueShareCode();

  return prisma.flashcardShare.create({
    data: {
      ownerUserId: user.id,
      rootDeckId: deck.id,
      shareCode,
      title: payload.rootTitle,
      payloadJson: payload
    }
  });
}

export async function importSharedFlashcardDeck(shareCode: string) {
  const normalizedShareCode = shareCode.trim().toUpperCase();
  if (!normalizedShareCode) {
    return {
      ok: false,
      source: "share" as const,
      decksImported: 0,
      cardsImported: 0,
      message: "Le code de partage est vide."
    };
  }

  const { user, prepClass } = await ensureDemoFlashcards();
  const share = await prisma.flashcardShare.findUnique({
    where: {
      shareCode: normalizedShareCode
    }
  });

  if (!share) {
    return {
      ok: false,
      source: "share" as const,
      decksImported: 0,
      cardsImported: 0,
      message: "Aucun deck ne correspond a ce code de partage."
    };
  }

  const result = await importExportPayload(
    share.payloadJson as unknown as DeckExportPayload,
    user.id,
    prepClass.id
  );

  if (result.error) {
    return {
      ok: false,
      source: "share" as const,
      decksImported: 0,
      cardsImported: 0,
      message: result.error
    };
  }

  return {
    ok: true,
    source: "share" as const,
    decksImported: result.decksImported,
    cardsImported: result.cardsImported,
    message: `${result.decksImported} decks et ${result.cardsImported} cartes ont ete importes.`
  };
}

export async function importFlashcardArchive(file: File | null): Promise<FlashcardImportResult> {
  if (!file || !file.name) {
    return {
      ok: false,
      source: "json",
      decksImported: 0,
      cardsImported: 0,
      message: "Aucun fichier n'a ete selectionne."
    };
  }

  const extension = path.extname(file.name).toLowerCase();
  const { user, prepClass } = await ensureDemoFlashcards();

  try {
    if (extension === ".json") {
      const payload = JSON.parse(await file.text()) as DeckExportPayload;
      const result = await importExportPayload(payload, user.id, prepClass.id);
      if (result.error) {
        return {
          ok: false,
          source: "json",
          decksImported: 0,
          cardsImported: 0,
          message: result.error
        };
      }

      return {
        ok: true,
        source: "json",
        decksImported: result.decksImported,
        cardsImported: result.cardsImported,
        message: `${result.decksImported} decks et ${result.cardsImported} cartes ont ete importes.`
      };
    }

    if (extension === ".apkg") {
      const apkgResult = await readApkgAsExportPayload(file);
      if (apkgResult.payloads.length === 0) {
        return {
          ok: false,
          source: "apkg",
          decksImported: 0,
          cardsImported: 0,
          message:
            apkgResult.warning ??
            "Le fichier `.apkg` n'a pas pu etre importe avec le format actuellement gere."
        };
      }

      let decksImported = 0;
      let cardsImported = 0;

      for (const payload of apkgResult.payloads) {
        const result = await importExportPayload(payload, user.id, prepClass.id);
        if (result.error) {
          continue;
        }

        decksImported += result.decksImported;
        cardsImported += result.cardsImported;
      }

      return {
        ok: decksImported > 0 && cardsImported > 0,
        source: "apkg",
        decksImported,
        cardsImported,
        message:
          decksImported > 0
            ? apkgResult.warning
              ? `${decksImported} decks et ${cardsImported} cartes importes. ${apkgResult.warning}`
              : `${decksImported} decks et ${cardsImported} cartes importes depuis Anki.`
            : apkgResult.warning ??
              "Aucune carte n'a pu etre importee depuis ce fichier `.apkg`."
      };
    }

    return {
      ok: false,
      source: "json",
      decksImported: 0,
      cardsImported: 0,
      message: "Seuls les fichiers `.json` et `.apkg` sont acceptes."
    };
  } catch (error) {
    console.error("Flashcard import failed", error);
    return {
      ok: false,
      source: extension === ".apkg" ? "apkg" : "json",
      decksImported: 0,
      cardsImported: 0,
      message: "L'import a echoue. Le fichier est peut-etre incompatible ou incomplet."
    };
  }
}

export async function getFlashcardsOverviewData(): Promise<FlashcardsOverviewData> {
  const { user } = await ensureDemoFlashcards();
  const now = new Date();

  const [decks, allCards, reviews, subjectsForForms, recentShares] = await Promise.all([
    prisma.flashcardDeck.findMany({
      where: { ownerUserId: user.id },
      select: {
        id: true,
        title: true,
        parentDeckId: true,
        subject: {
          select: {
            name: true
          }
        },
        chapter: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.flashcard.findMany({
      where: {
        deck: {
          ownerUserId: user.id
        }
      },
      select: {
        id: true,
        deckId: true,
        position: true,
        frontText: true,
        backText: true,
        deck: {
          select: {
            id: true,
            title: true,
            subject: {
              select: {
                name: true
              }
            }
          }
        },
        states: {
          where: { userId: user.id },
          select: {
            status: true,
            nextReviewAt: true
          }
        }
      },
      orderBy: [{ deck: { title: "asc" } }, { position: "asc" }]
    }),
    prisma.flashcardReview.findMany({
      where: {
        userId: user.id,
        flashcard: {
          deck: {
            ownerUserId: user.id
          }
        }
      },
      select: {
        flashcardId: true,
        rating: true
      }
    }),
    prisma.subject.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.flashcardShare.findMany({
      where: {
        ownerUserId: user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 6
    })
  ]);

  const reviewStatsByCardId = reviews.reduce((map, review) => {
    const current = map.get(review.flashcardId) ?? {
      totalReviews: 0,
      successfulReviews: 0
    };

    current.totalReviews += 1;
    if (review.rating !== FlashcardRating.AGAIN) {
      current.successfulReviews += 1;
    }

    map.set(review.flashcardId, current);
    return map;
  }, new Map<string, { totalReviews: number; successfulReviews: number }>());

  const deckStatsById = decks.reduce((map, deck) => {
    map.set(deck.id, {
      due: 0,
      newCards: 0,
      total: 0,
      totalReviews: 0,
      successfulReviews: 0
    });
    return map;
  }, new Map<string, { due: number; newCards: number; total: number; totalReviews: number; successfulReviews: number }>());

  for (const card of allCards) {
    const deckStats = deckStatsById.get(card.deckId);
    if (!deckStats) {
      continue;
    }

    const state = card.states[0];
    const reviewStats = reviewStatsByCardId.get(card.id);

    deckStats.total += 1;
    if (!state || state.status === FlashcardStatus.NEW) {
      deckStats.newCards += 1;
    }
    if (!state?.nextReviewAt || state.nextReviewAt <= now) {
      deckStats.due += 1;
    }
    if (reviewStats) {
      deckStats.totalReviews += reviewStats.totalReviews;
      deckStats.successfulReviews += reviewStats.successfulReviews;
    }
  }

  const deckSummaries = decks.map((deck) => {
    const stats = deckStatsById.get(deck.id) ?? {
      due: 0,
      newCards: 0,
      total: 0,
      totalReviews: 0,
      successfulReviews: 0
    };

    return {
      id: deck.id,
      title: deck.title,
      subject: deck.subject.name,
      chapter: deck.chapter?.name ?? "Sans chapitre",
      parentDeckId: deck.parentDeckId,
      due: stats.due,
      newCards: stats.newCards,
      total: stats.total,
      totalReviews: stats.totalReviews,
      successfulReviews: stats.successfulReviews
    };
  });
  const deckSummariesById = new Map(deckSummaries.map((deck) => [deck.id, deck]));
  const deckPathCache = new Map<string, string>();
  const childrenByParentId = deckSummaries.reduce((groups, deck) => {
    const key = deck.parentDeckId ?? "__root__";
    const existing = groups.get(key) ?? [];
    existing.push(deck);
    groups.set(key, existing);
    return groups;
  }, new Map<string, typeof deckSummaries>());

  const getDeckPath = (deckId: string): string => {
    const cached = deckPathCache.get(deckId);
    if (cached) {
      return cached;
    }

    const deck = deckSummariesById.get(deckId);
    if (!deck) {
      return "";
    }

    const fullTitle = deck.parentDeckId
      ? `${getDeckPath(deck.parentDeckId)} / ${deck.title}`
      : deck.title;

    deckPathCache.set(deckId, fullTitle);
    return fullTitle;
  };

  type AggregatedDeckNode = FlashcardsOverviewDeckNode & {
    totalReviews: number;
    successfulReviews: number;
  };

  const buildDeckNode = (
    deck: (typeof deckSummaries)[number],
    depth: number
  ): AggregatedDeckNode => {
    const childSummaries = (childrenByParentId.get(deck.id) ?? []).sort((left, right) =>
      left.title.localeCompare(right.title, "fr")
    );
    const children = childSummaries.map((child) => buildDeckNode(child, depth + 1));
    const totalReviews = deck.totalReviews + children.reduce((sum, child) => sum + child.totalReviews, 0);
    const successfulReviews =
      deck.successfulReviews + children.reduce((sum, child) => sum + child.successfulReviews, 0);
    const due = deck.due + children.reduce((sum, child) => sum + child.due, 0);
    const newCards = deck.newCards + children.reduce((sum, child) => sum + child.newCards, 0);
    const total = deck.total + children.reduce((sum, child) => sum + child.total, 0);

    return {
      id: deck.id,
      title: deck.title,
      fullTitle: getDeckPath(deck.id),
      subject: deck.subject,
      due,
      newCards,
      retention: totalReviews > 0 ? Math.round((successfulReviews / totalReviews) * 100) : 0,
      total,
      chapter: deck.chapter,
      isLeaf: children.length === 0,
      depth,
      childCount: children.length,
      children,
      totalReviews,
      successfulReviews
    };
  };

  const rootDeckNodes = deckSummaries
    .filter((deck) => !deck.parentDeckId)
    .sort((left, right) => left.title.localeCompare(right.title, "fr"))
    .map((deck) => buildDeckNode(deck, 0));

  const countDeckNodes = (node: FlashcardsOverviewDeckNode): number =>
    1 + node.children.reduce((sum, child) => sum + countDeckNodes(child), 0);

  const subjectGroups = Array.from(
    rootDeckNodes.reduce((groups, deck) => {
      const existingGroup = groups.get(deck.subject) ?? {
        subject: deck.subject,
        totalDue: 0,
        totalCards: 0,
        deckCount: 0,
        decks: [] as FlashcardsOverviewData["subjectGroups"][number]["decks"]
      };

      existingGroup.totalDue += deck.due;
      existingGroup.totalCards += deck.total;
      existingGroup.deckCount += countDeckNodes(deck);
      existingGroup.decks.push(deck);
      groups.set(deck.subject, existingGroup);
      return groups;
    }, new Map<string, FlashcardsOverviewData["subjectGroups"][number]>())
  )
    .map(([, value]) => ({
      ...value,
      decks: value.decks.sort((left, right) => left.title.localeCompare(right.title, "fr"))
    }))
    .sort((left, right) => left.subject.localeCompare(right.subject, "fr"));

  const browserCards = allCards
    .map((card) => {
      const state = card.states[0];
      const deckPath = getDeckPath(card.deckId) || card.deck.title;

      return {
        id: card.id,
        deckId: card.deckId,
        deckTitle: card.deck.title,
        deckPath,
        subject: card.deck.subject.name,
        frontText: card.frontText,
        backText: card.backText,
        nextReviewLabel: getNextReviewLabel(state?.nextReviewAt ?? null, state?.status ?? null),
        statusLabel: getStatusLabel(state?.status ?? null)
      };
    })
    .sort((left, right) => {
      const deckCompare = left.deckPath.localeCompare(right.deckPath, "fr");
      if (deckCompare !== 0) {
        return deckCompare;
      }

      return stripCardHtmlForSearch(left.frontText).localeCompare(
        stripCardHtmlForSearch(right.frontText),
        "fr"
      );
    });

  const leafDeckSummaries = deckSummaries
    .map((deck) => ({
      ...deck,
      fullTitle: getDeckPath(deck.id),
      retention:
        deck.totalReviews > 0 ? Math.round((deck.successfulReviews / deck.totalReviews) * 100) : 0
    }))
    .filter((deck) => (childrenByParentId.get(deck.id) ?? []).length === 0);
  const activeLeafDecks = leafDeckSummaries.filter((deck) => deck.total > 0);
  const totalDue = activeLeafDecks.reduce((sum, deck) => sum + deck.due, 0);
  const stableDecks = activeLeafDecks.filter((deck) => deck.retention >= 75).length;

  return {
    subjectGroups,
    globalState: {
      due: totalDue,
      active: activeLeafDecks.length,
      stable: stableDecks
    },
    reviewDeckId:
      activeLeafDecks.find((deck) => deck.total > 0 && (deck.due > 0 || deck.newCards > 0))?.id ??
      activeLeafDecks.find((deck) => deck.total > 0)?.id ??
      null,
    decksForForms: leafDeckSummaries
      .map((deck) => ({
        id: deck.id,
        title: deck.fullTitle,
        subject: deck.subject
      }))
      .sort((left, right) =>
        `${left.subject} ${left.title}`.localeCompare(`${right.subject} ${right.title}`, "fr")
      ),
    parentDeckOptions: decks
      .filter((deck) => !deck.parentDeckId)
      .map((deck) => ({
        id: deck.id,
        title: getDeckPath(deck.id),
        subject: deck.subject.name
      }))
      .sort((left, right) =>
        `${left.subject} ${left.title}`.localeCompare(`${right.subject} ${right.title}`, "fr")
      ),
    transferDecks: decks
      .map((deck) => ({
        id: deck.id,
        title: getDeckPath(deck.id),
        subject: deck.subject.name,
        isRoot: !deck.parentDeckId
      }))
      .sort((left, right) =>
        `${left.subject} ${left.title}`.localeCompare(`${right.subject} ${right.title}`, "fr")
      ),
    recentShares: recentShares.map((share) => ({
      id: share.id,
      shareCode: share.shareCode,
      title: share.title,
      createdAtLabel: new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short"
      }).format(share.createdAt)
    })),
    subjectsForForms: subjectsForForms.map((subject) => ({
      code: subject.code,
      name: subject.name
    })),
    browserCards
  };
}

export async function getFlashcardDeckData(deckId: string): Promise<FlashcardDeckData | null> {
  const { user } = await ensureDemoFlashcards();
  const now = new Date();

  const deck = await prisma.flashcardDeck.findFirst({
    where: {
      id: deckId,
      ownerUserId: user.id
    },
    include: {
      subject: true,
      chapter: true,
      flashcards: {
        include: {
          states: {
            where: { userId: user.id }
          },
          reviews: {
            where: { userId: user.id },
            orderBy: { reviewedAt: "desc" },
            take: 12
          }
        },
        orderBy: { position: "asc" }
      }
    }
  });

  if (!deck) {
    return null;
  }

  const dueCards = deck.flashcards.filter((card) => {
    const state = card.states[0];
    return !state?.nextReviewAt || state.nextReviewAt <= now;
  });

  const reviewCardSource = dueCards[0] ?? deck.flashcards[0] ?? null;
  const reviewCardState = reviewCardSource?.states[0] ?? null;
  const reviewCardLatestReview = reviewCardSource?.reviews[0] ?? null;
  const reviewCardCurrentIntervalDays = reviewCardSource
    ? (reviewCardLatestReview?.intervalDays ??
      getCurrentIntervalDays(
        reviewCardState?.lastReviewAt ?? null,
        reviewCardState?.nextReviewAt ?? null
      ))
    : 0;

  return {
    deck: {
      id: deck.id,
      title: deck.title,
      subject: deck.subject.name,
      chapter: deck.chapter?.name ?? "Sans chapitre",
      description: deck.description
    },
    stats: {
      due: dueCards.length,
      newCards: deck.flashcards.filter((card) => {
        const state = card.states[0];
        return !state || state.status === FlashcardStatus.NEW;
      }).length,
      retention: getRetention(deck.flashcards.flatMap((card) => card.reviews)),
      total: deck.flashcards.length,
      reviewedCards: deck.flashcards.filter((card) => card.reviews.length > 0).length
    },
    reviewCard: reviewCardSource
      ? {
          id: reviewCardSource.id,
          frontText: reviewCardSource.frontText,
          backText: reviewCardSource.backText,
          tags: Array.isArray(reviewCardSource.tags)
            ? reviewCardSource.tags.map(String)
            : []
        }
      : null,
    reviewOptions: reviewCardSource
      ? getReviewOptions({
          currentStatus: reviewCardState?.status ?? null,
          repetitionCount: reviewCardState?.repetitionCount ?? 0,
          lapseCount: reviewCardState?.lapseCount ?? 0,
          currentIntervalDays: reviewCardCurrentIntervalDays,
          storedStabilityScore: reviewCardState?.stabilityScore ?? null,
          storedDifficultyScore: reviewCardState?.difficultyScore ?? null
        })
      : [],
    browserCards: deck.flashcards.map((card) => {
      const state = card.states[0];

      return {
        id: card.id,
        frontText: card.frontText,
        backText: card.backText,
        nextReviewLabel: getNextReviewLabel(state?.nextReviewAt ?? null, state?.status ?? null),
        statusLabel: getStatusLabel(state?.status ?? null)
      };
    })
  };
}

export async function createFlashcardDeck(input: {
  title: string;
  subjectCode: string;
  parentDeckId?: string;
}) {
  const { user, prepClass } = await ensureDemoFlashcards();
  const subject = await prisma.subject.findUnique({
    where: { code: input.subjectCode }
  });

  if (!subject || !input.title.trim()) {
    return;
  }

  let parentDeckId: string | null = null;

  if (input.parentDeckId) {
    const parentDeck = await prisma.flashcardDeck.findFirst({
      where: {
        id: input.parentDeckId,
        ownerUserId: user.id,
        subjectId: subject.id,
        parentDeckId: null
      }
    });

    if (!parentDeck) {
      return;
    }

    parentDeckId = parentDeck.id;
  }

  await prisma.flashcardDeck.create({
    data: {
      ownerUserId: user.id,
      classId: prepClass.id,
      subjectId: subject.id,
      parentDeckId,
      title: input.title.trim(),
      description: null,
      createdByType: "MANUAL"
    }
  });
}

export async function createFlashcard(input: {
  deckId: string;
  frontText: string;
  backText: string;
}) {
  const { user } = await ensureDemoFlashcards();
  if (!input.frontText.trim() || !input.backText.trim()) {
    return;
  }

  const deck = await prisma.flashcardDeck.findFirst({
    where: {
      id: input.deckId,
      ownerUserId: user.id
    },
    include: {
      _count: {
        select: {
          flashcards: true
        }
      }
    }
  });

  if (!deck) {
    return;
  }

  await prisma.flashcard.create({
    data: {
      deckId: deck.id,
      frontText: input.frontText.trim(),
      backText: input.backText.trim(),
      position: deck._count.flashcards + 1
    }
  });
}

export async function reviewFlashcard(input: {
  cardId: string;
  deckId: string;
  rating: FlashcardRating;
}) {
  const { user } = await ensureDemoFlashcards();

  const card = await prisma.flashcard.findFirst({
    where: {
      id: input.cardId,
      deckId: input.deckId,
      deck: {
        ownerUserId: user.id
      }
    },
    include: {
      states: {
        where: { userId: user.id }
      },
      reviews: {
        where: { userId: user.id },
        orderBy: { reviewedAt: "desc" },
        take: 1
      }
    }
  });

  if (!card) {
    return;
  }

  const existingState = card.states[0] ?? null;
  const latestReview = card.reviews[0] ?? null;
  const currentIntervalDays =
    latestReview?.intervalDays ??
    getCurrentIntervalDays(existingState?.lastReviewAt ?? null, existingState?.nextReviewAt ?? null);

  const decision = getReviewDecision(
    input.rating,
    existingState?.status ?? null,
    existingState?.repetitionCount ?? 0,
    existingState?.lapseCount ?? 0,
    currentIntervalDays,
    existingState?.stabilityScore ?? null,
    existingState?.difficultyScore ?? null
  );

  await prisma.$transaction(async (tx) => {
    await tx.flashcardReview.create({
      data: {
        flashcardId: card.id,
        userId: user.id,
        rating: input.rating,
        reviewedAt: new Date(),
        nextReviewAt: decision.nextReviewAt,
        stabilityScore: decision.stabilityScore,
        difficultyScore: decision.difficultyScore,
        intervalDays: decision.intervalDays
      }
    });

    await tx.flashcardState.upsert({
      where: {
        flashcardId_userId: {
          flashcardId: card.id,
          userId: user.id
        }
      },
      update: {
        status: decision.status,
        lastReviewAt: new Date(),
        nextReviewAt: decision.nextReviewAt,
        repetitionCount: decision.repetitionCount,
        lapseCount: decision.lapseCount,
        easeScore: decision.easeScore,
        stabilityScore: decision.stabilityScore,
        difficultyScore: decision.difficultyScore
      },
      create: {
        flashcardId: card.id,
        userId: user.id,
        status: decision.status,
        lastReviewAt: new Date(),
        nextReviewAt: decision.nextReviewAt,
        repetitionCount: decision.repetitionCount,
        lapseCount: decision.lapseCount,
        easeScore: decision.easeScore,
        stabilityScore: decision.stabilityScore,
        difficultyScore: decision.difficultyScore
      }
    });
  });
}
