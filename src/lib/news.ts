import { Prisma } from "@prisma/client";

import { prisma } from "./db";
import {
  ensureDemoStudent,
  getLanguagePreferences,
  getLv2LanguageLabel,
  type Lv2Language
} from "./student-app";

type FeedEntry = {
  title: string;
  url: string;
  summary: string;
  publishedAt: Date | null;
  publishedAtLabel: string;
};

type NewsSectionConfig = {
  id: "uk" | "us" | "lv2";
  title: string;
  languageLabel: string;
  sourceName: string;
  sourceLabel: string;
  sourceUrl: string;
  feedUrls: string[];
  keywords: string[];
};

type SelectedNewsArticle = {
  title: string;
  url: string;
  summary: string;
  publishedAt: Date | null;
  publishedAtLabel: string;
  isLive: boolean;
  hasFreshArticle: boolean;
};

export type StudentNewsData = {
  hasProfile: boolean;
  lv2Label: string;
  sections: Array<{
    id: "uk" | "us" | "lv2";
    title: string;
    languageLabel: string;
    sourceName: string;
    sourceLabel: string;
    articleTitle: string;
    articleUrl: string;
    publishedAtLabel: string;
    excerpt: string;
    isLive: boolean;
    hasFreshArticle: boolean;
  }>;
};

const FEED_TIMEOUT_MS = 3500;
const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const SELECTION_TTL_MS = 24 * 60 * 60 * 1000;

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value: string) {
  return decodeHtml(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block: string, tagName: string) {
  const directMatch = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  if (directMatch?.[1]) {
    return stripHtml(directMatch[1]);
  }

  const hrefAttributeMatch = block.match(new RegExp(`<${tagName}[^>]*href="([^"]+)"[^>]*/?>`, "i"));
  if (hrefAttributeMatch?.[1]) {
    return hrefAttributeMatch[1].trim();
  }

  const atomAttributeMatch = block.match(new RegExp(`<${tagName}[^>]*rel="alternate"[^>]*href="([^"]+)"[^>]*/?>`, "i"));
  return atomAttributeMatch?.[1]?.trim() ?? "";
}

function parsePublishedAt(rawDate: string) {
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatPublishedAtLabel(date: Date | null) {
  if (!date) {
    return "Date recente";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short"
  });
}

function parseFeed(xml: string) {
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const entryBlocks = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  const blocks = itemBlocks.length > 0 ? itemBlocks : entryBlocks;

  return blocks
    .map((block) => {
      const title = extractTag(block, "title");
      const url = extractTag(block, "link");
      const summary =
        extractTag(block, "description") || extractTag(block, "content") || extractTag(block, "summary");
      const publishedAtRaw =
        extractTag(block, "pubDate") || extractTag(block, "published") || extractTag(block, "updated");
      const publishedAt = parsePublishedAt(publishedAtRaw);

      if (!title || !url) {
        return null;
      }

      return {
        title,
        url,
        summary,
        publishedAt,
        publishedAtLabel: formatPublishedAtLabel(publishedAt)
      };
    })
    .filter((entry): entry is FeedEntry => Boolean(entry));
}

async function fetchFeedEntries(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 },
      signal: controller.signal,
      headers: {
        "User-Agent": "Prepa-ECG-OS/1.0"
      }
    });

    if (!response.ok) {
      return [];
    }

    return parseFeed(await response.text());
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function scoreEntry(entry: FeedEntry, keywords: string[]) {
  const text = `${entry.title} ${entry.summary}`.toLowerCase();
  return keywords.reduce((score, keyword) => (text.includes(keyword) ? score + 2 : score), 0);
}

function isRecentEnough(entry: FeedEntry, now: Date) {
  return Boolean(entry.publishedAt && now.getTime() - entry.publishedAt.getTime() <= RECENT_WINDOW_MS);
}

function deduplicateEntries(entries: FeedEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = entry.url.trim();
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function getActiveSelection(userId: string, config: Pick<NewsSectionConfig, "id" | "sourceName">, now: Date) {
  return prisma.newsSelection.findFirst({
    where: {
      userId,
      sectionId: config.id,
      sourceName: config.sourceName,
      expiresAt: {
        gt: now
      }
    },
    orderBy: {
      selectedAt: "desc"
    }
  });
}

async function selectEntry(config: NewsSectionConfig, userId: string, now: Date): Promise<SelectedNewsArticle> {
  const activeSelection = await getActiveSelection(userId, config, now);
  if (activeSelection) {
    return {
      title: activeSelection.articleTitle,
      url: activeSelection.articleUrl,
      summary: `Article deja selectionne pour aujourd'hui dans ${config.sourceName}.`,
      publishedAt: activeSelection.publishedAt,
      publishedAtLabel: formatPublishedAtLabel(activeSelection.publishedAt),
      isLive: true,
      hasFreshArticle: true
    };
  }

  const [history, rawEntries] = await Promise.all([
    prisma.newsSelection.findMany({
      where: { userId },
      select: { articleUrl: true }
    }),
    Promise.all(config.feedUrls.map((feedUrl) => fetchFeedEntries(feedUrl)))
  ]);

  const seenUrls = new Set(history.map((item) => item.articleUrl));
  const entries = deduplicateEntries(rawEntries.flat())
    .filter((entry) => isRecentEnough(entry, now))
    .filter((entry) => !seenUrls.has(entry.url))
    .sort((left, right) => {
      const scoreDelta = scoreEntry(right, config.keywords) - scoreEntry(left, config.keywords);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      const rightTime = right.publishedAt?.getTime() ?? 0;
      const leftTime = left.publishedAt?.getTime() ?? 0;
      return rightTime - leftTime;
    });

  const selected = entries[0];

  if (!selected) {
    return {
      title: "Aucune nouvelle proposition recente disponible",
      url: config.sourceUrl,
      summary:
        "La rubrique attend un nouvel article de moins de 7 jours qui n'a pas encore ete propose. Reviens demain pour une nouvelle rotation.",
      publishedAt: null,
      publishedAtLabel: "A verifier demain",
      isLive: false,
      hasFreshArticle: false
    };
  }

  await prisma.newsSelection.create({
    data: {
      userId,
      sectionId: config.id,
      articleUrl: selected.url,
      articleTitle: selected.title,
      sourceName: config.sourceName,
      publishedAt: selected.publishedAt,
      expiresAt: new Date(now.getTime() + SELECTION_TTL_MS)
    }
  });

  return {
    ...selected,
    isLive: true,
    hasFreshArticle: true
  };
}

function getLv2SectionConfig(language: Lv2Language): NewsSectionConfig {
  if (language === "ALLEMAND") {
    return {
      id: "lv2",
      title: "LV2",
      languageLabel: "Allemand",
      sourceName: "DIE ZEIT",
      sourceLabel: "Presse allemande",
      sourceUrl: "https://www.zeit.de",
      feedUrls: ["https://newsfeed.zeit.de/index"],
      keywords: [
        "deutschland",
        "europa",
        "wirtschaft",
        "energie",
        "wahl",
        "krieg",
        "industrie",
        "china",
        "handel",
        "migration"
      ]
    };
  }

  if (language === "ITALIEN") {
    return {
      id: "lv2",
      title: "LV2",
      languageLabel: "Italien",
      sourceName: "Il Post",
      sourceLabel: "Presse italienne",
      sourceUrl: "https://www.ilpost.it",
      feedUrls: ["https://www.ilpost.it/feed/"],
      keywords: [
        "italia",
        "europa",
        "economia",
        "governo",
        "energia",
        "ucraina",
        "migrazione",
        "industria",
        "debito",
        "tecnologia"
      ]
    };
  }

  return {
    id: "lv2",
    title: "LV2",
    languageLabel: "Espagnol",
    sourceName: "El Pais",
    sourceLabel: "Presse hispanique",
    sourceUrl: "https://elpais.com",
    feedUrls: ["https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada"],
    keywords: [
      "america latina",
      "economia",
      "gobierno",
      "inflacion",
      "energia",
      "migracion",
      "elecciones",
      "europa",
      "china",
      "tecnologia"
    ]
  };
}

function getSectionsConfig(language: Lv2Language): NewsSectionConfig[] {
  return [
    {
      id: "uk",
      title: "LV1 anglais",
      languageLabel: "Anglais",
      sourceName: "The Guardian",
      sourceLabel: "Presse britannique",
      sourceUrl: "https://www.theguardian.com",
      feedUrls: ["https://www.theguardian.com/world/rss", "https://www.theguardian.com/business/rss"],
      keywords: [
        "uk",
        "britain",
        "europe",
        "trade",
        "inflation",
        "growth",
        "election",
        "government",
        "energy",
        "technology",
        "china",
        "war"
      ]
    },
    {
      id: "us",
      title: "LV1 anglais",
      languageLabel: "Anglais",
      sourceName: "The New York Times",
      sourceLabel: "Presse americaine",
      sourceUrl: "https://www.nytimes.com",
      feedUrls: [
        "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml"
      ],
      keywords: [
        "united states",
        "us",
        "america",
        "tariffs",
        "election",
        "federal reserve",
        "inflation",
        "technology",
        "ai",
        "china",
        "economy",
        "geopolitics"
      ]
    },
    getLv2SectionConfig(language)
  ];
}

export async function getStudentNewsData(): Promise<StudentNewsData> {
  const { user } = await ensureDemoStudent();
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id }
  });

  if (!profile) {
    return {
      hasProfile: false,
      lv2Label: "Espagnol",
      sections: []
    };
  }

  const now = new Date();
  const languagePreferences = getLanguagePreferences(profile.energyProfile as Prisma.JsonObject | null);
  const sectionsConfig = getSectionsConfig(languagePreferences.lv2);
  const sections = await Promise.all(
    sectionsConfig.map(async (config) => {
      const selected = await selectEntry(config, user.id, now);

      return {
        id: config.id,
        title: config.title,
        languageLabel: config.languageLabel,
        sourceName: config.sourceName,
        sourceLabel: config.sourceLabel,
        articleTitle: selected.title,
        articleUrl: selected.url,
        publishedAtLabel: selected.publishedAtLabel,
        excerpt: selected.summary,
        isLive: selected.isLive,
        hasFreshArticle: selected.hasFreshArticle
      };
    })
  );

  return {
    hasProfile: true,
    lv2Label: getLv2LanguageLabel(languagePreferences.lv2),
    sections
  };
}
