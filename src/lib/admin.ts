import { Prisma, UserRole } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

import { getPublicAppUrl } from "./app-config";
import { getAIGuardrailConfig, getAIModel } from "./ai-guardrails";
import type { AITaskId } from "./ai-task-catalog";
import { recordSecurityEvent, requireRole } from "./auth";
import { prisma } from "./db";
import { getRuntimeStatus } from "./runtime-status";

const FAILURE_EVENTS = ["LOGIN_FAILURE", "LOGIN_BLOCKED", "LOGIN_RATE_LIMITED"];

function formatDate(value: Date | null) {
  if (!value) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris"
  }).format(value);
}

function getDeviceLabel(userAgent: string | null) {
  if (!userAgent) return "Non renseigne";
  const device = /iPhone/i.test(userAgent)
    ? "iPhone"
    : /iPad/i.test(userAgent)
      ? "iPad"
      : /Android/i.test(userAgent)
        ? "Android"
        : /Macintosh|Mac OS/i.test(userAgent)
          ? "Mac"
          : /Windows/i.test(userAgent)
            ? "PC Windows"
            : "Ordinateur";
  const browser = /Edg\//i.test(userAgent)
    ? "Edge"
    : /Chrome\//i.test(userAgent)
      ? "Chrome"
      : /Safari\//i.test(userAgent)
        ? "Safari"
        : /Firefox\//i.test(userAgent)
          ? "Firefox"
          : "Navigateur";
  return `${device} - ${browser}`;
}

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    ACCOUNT_CREATED: "Compte cree",
    LOGIN_SUCCESS: "Connexion reussie",
    LOGIN_FAILURE: "Echec de connexion",
    LOGIN_BLOCKED: "Compte suspendu bloque",
    LOGIN_RATE_LIMITED: "Trop de tentatives",
    SIGNUP_RATE_LIMITED: "Inscriptions limitees",
    LOGOUT: "Deconnexion",
    PASSWORD_RESET: "Mot de passe modifie",
    ACCOUNT_SUSPENDED: "Compte suspendu",
    ACCOUNT_REACTIVATED: "Compte reactive",
    ESTABLISHMENT_CREATED: "Etablissement cree",
    ACCESS_CODE_ROTATED: "Code d'acces renouvele",
    TEACHER_INVITATION_CREATED: "Invitation professeur creee",
    TEACHER_INVITATION_REVOKED: "Invitation professeur revoquee",
    SECURITY_LOG_PURGED: "Journal de securite nettoye"
  };
  return labels[eventType] ?? eventType.replaceAll("_", " ").toLowerCase();
}

function mapEvent(event: {
  id: string;
  eventType: string;
  createdAt: Date;
  ipHash: string | null;
  userAgent: string | null;
  user: { firstName: string; lastName: string; email: string; role: UserRole } | null;
}) {
  return {
    id: event.id,
    type: event.eventType,
    label: eventLabel(event.eventType),
    occurredAt: formatDate(event.createdAt),
    account: event.user ? `${event.user.firstName} ${event.user.lastName}` : "Compte non identifie",
    email: event.user?.email ?? null,
    role: event.user?.role ?? null,
    source: event.ipHash ? event.ipHash.slice(0, 10).toUpperCase() : "Non disponible",
    device: getDeviceLabel(event.userAgent),
    isAlert: FAILURE_EVENTS.includes(event.eventType)
  };
}

export async function getAdminOverviewData() {
  await requireRole([UserRole.ADMIN]);
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, activeUsers, newUsers, classes, loginSuccess, loginFailures,
    resources, essays, cards, completedSessions, recentEvents, classMemberships,
    activeInvitations
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
    prisma.class.count(),
    prisma.authEvent.count({ where: { eventType: "LOGIN_SUCCESS", createdAt: { gte: last24Hours } } }),
    prisma.authEvent.count({ where: { eventType: { in: FAILURE_EVENTS }, createdAt: { gte: last24Hours } } }),
    prisma.resource.count(),
    prisma.essay.count(),
    prisma.flashcard.count(),
    prisma.studySession.count({ where: { status: "COMPLETED" } }),
    prisma.authEvent.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.classMembership.findMany({ select: { classId: true, roleInClass: true } }),
    prisma.teacherInvitation.count({ where: { usedAt: null, expiresAt: { gt: now } } })
  ]);

  const teacherClassIds = new Set(
    classMemberships.filter((membership) => membership.roleInClass === "teacher").map((membership) => membership.classId)
  );
  const noTeacherCount = Math.max(0, classes - teacherClassIds.size);

  return {
    stats: [
      { label: "Comptes", value: totalUsers, helper: `${activeUsers} actifs - ${totalUsers - activeUsers} suspendus` },
      { label: "Nouveaux comptes", value: newUsers, helper: "Sur les 7 derniers jours" },
      { label: "Connexions", value: loginSuccess, helper: "Reussies sur les dernieres 24 h" },
      { label: "Alertes connexion", value: loginFailures, helper: "Echecs ou blocages sur 24 h" },
      { label: "Etablissements", value: classes, helper: `${noTeacherCount} sans professeur` },
      { label: "Invitations actives", value: activeInvitations, helper: "Professeurs uniquement" }
    ],
    content: { resources, essays, cards, completedSessions },
    recentEvents: recentEvents.map(mapEvent)
  };
}

export async function getAdminUsersData(filters: { query?: string; role?: string; status?: string }) {
  await requireRole([UserRole.ADMIN]);
  const query = filters.query?.trim().slice(0, 100) ?? "";
  const role = Object.values(UserRole).includes(filters.role as UserRole) ? filters.role as UserRole : undefined;
  const isActive = filters.status === "active" ? true : filters.status === "suspended" ? false : undefined;
  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(isActive === undefined ? {} : { isActive }),
    ...(query ? {
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { email: { contains: query } }
      ]
    } : {})
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        memberships: { include: { class: true }, orderBy: { createdAt: "asc" } },
        _count: { select: { uploadedResources: true, decks: true, essays: true, assignedEssays: true } }
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100
    }),
    prisma.user.count({ where })
  ]);

  return {
    total,
    users: users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      roleLabel: user.role === "STUDENT" ? "Eleve" : user.role === "TEACHER" ? "Professeur" : "Administrateur",
      isActive: user.isActive,
      establishment: user.memberships[0]?.class.name ?? "Aucun etablissement",
      createdAt: formatDate(user.createdAt),
      lastLoginAt: formatDate(user.lastLoginAt),
      loginCount: user.loginCount,
      legalStatus: user.termsAcceptedAt && user.termsVersion
        ? `CGU ${user.termsVersion}`
        : "Acceptation non tracee",
      contentCount: user._count.uploadedResources + user._count.decks + user._count.essays + user._count.assignedEssays
    }))
  };
}

export async function setAdminUserActive(userId: string, isActive: boolean) {
  const admin = await requireRole([UserRole.ADMIN]);
  if (!userId || userId === admin.id) return { ok: false, message: "Tu ne peux pas suspendre ton propre compte." };
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, message: "Compte introuvable." };
  if (target.role === UserRole.ADMIN) return { ok: false, message: "Un autre administrateur ne peut pas etre modifie ici." };
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  await recordSecurityEvent({
    eventType: isActive ? "ACCOUNT_REACTIVATED" : "ACCOUNT_SUSPENDED",
    userId,
    email: target.email,
    metadata: { actorId: admin.id, targetRole: target.role }
  });
  return { ok: true, message: isActive ? "Compte reactive." : "Compte suspendu immediatement." };
}

export async function getAdminEstablishmentsData() {
  await requireRole([UserRole.ADMIN]);
  const [classes, invitations] = await Promise.all([
    prisma.class.findMany({
      include: {
        memberships: { select: { roleInClass: true } },
        _count: { select: { resources: true, decks: true } }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.teacherInvitation.findMany({
      include: { class: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);
  const now = Date.now();
  return {
    classes: classes.map((prepClass) => ({
      id: prepClass.id,
      name: prepClass.name,
      yearLabel: prepClass.yearLabel,
      track: prepClass.track,
      accessCode: prepClass.accessCode,
      students: prepClass.memberships.filter((membership) => membership.roleInClass === "student").length,
      teachers: prepClass.memberships.filter((membership) => membership.roleInClass === "teacher").length,
      resources: prepClass._count.resources,
      decks: prepClass._count.decks
    })),
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      establishment: invitation.class.name,
      createdAt: formatDate(invitation.createdAt),
      expiresAt: formatDate(invitation.expiresAt),
      status: invitation.usedAt ? "Utilisee ou revoquee" : invitation.expiresAt.getTime() <= now ? "Expiree" : "Active",
      canRevoke: !invitation.usedAt && invitation.expiresAt.getTime() > now
    }))
  };
}

export async function createAdminEstablishment(input: { name: string; yearLabel: string; track: string; accessCode: string }) {
  const admin = await requireRole([UserRole.ADMIN]);
  const name = input.name.trim().slice(0, 120);
  const yearLabel = input.yearLabel.trim().slice(0, 30);
  const track = input.track.trim().slice(0, 30) || "ECG";
  const accessCode = input.accessCode.trim().toUpperCase();
  if (!name || !yearLabel || !/^[A-Z0-9-]{4,32}$/.test(accessCode)) {
    return { ok: false, message: "Verifie le nom, l'annee et le code d'acces." };
  }
  try {
    const prepClass = await prisma.class.create({ data: { name, yearLabel, track, accessCode } });
    await recordSecurityEvent({ eventType: "ESTABLISHMENT_CREATED", metadata: { actorId: admin.id, classId: prepClass.id } });
    return { ok: true, message: "Etablissement cree." };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { ok: false, message: "Ce code d'acces est deja utilise." };
    }
    throw error;
  }
}

export async function rotateAdminAccessCode(classId: string) {
  const admin = await requireRole([UserRole.ADMIN]);
  const prepClass = await prisma.class.findUnique({ where: { id: classId } });
  if (!prepClass) return { ok: false, message: "Etablissement introuvable." };
  const prefix = prepClass.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase() || "PREPA";
  const accessCode = `${prefix}-${randomBytes(3).toString("hex").toUpperCase()}`;
  await prisma.class.update({ where: { id: classId }, data: { accessCode } });
  await recordSecurityEvent({ eventType: "ACCESS_CODE_ROTATED", metadata: { actorId: admin.id, classId } });
  return { ok: true, message: "Nouveau code genere.", accessCode };
}

export async function createAdminTeacherInvitation(input: { email: string; classId: string }) {
  const admin = await requireRole([UserRole.ADMIN]);
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Email invalide.", link: "" };
  const [prepClass, existingUser] = await Promise.all([
    prisma.class.findUnique({ where: { id: input.classId } }),
    prisma.user.findUnique({ where: { email } })
  ]);
  if (!prepClass) return { ok: false, message: "Etablissement introuvable.", link: "" };
  if (existingUser) return { ok: false, message: "Cette adresse possede deja un compte.", link: "" };
  const token = randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.teacherInvitation.updateMany({ where: { email, classId: prepClass.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.teacherInvitation.create({ data: {
      email,
      classId: prepClass.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    } })
  ]);
  const url = new URL("/signup", getPublicAppUrl());
  url.searchParams.set("invitation", token);
  url.searchParams.set("email", email);
  url.searchParams.set("accessCode", prepClass.accessCode);
  await recordSecurityEvent({ eventType: "TEACHER_INVITATION_CREATED", metadata: { actorId: admin.id, classId: prepClass.id } });
  return { ok: true, message: "Invitation valable 7 jours, utilisable une fois.", link: url.href };
}

export async function revokeAdminTeacherInvitation(invitationId: string) {
  const admin = await requireRole([UserRole.ADMIN]);
  const result = await prisma.teacherInvitation.updateMany({
    where: { id: invitationId, usedAt: null },
    data: { usedAt: new Date() }
  });
  if (result.count !== 1) return { ok: false, message: "Invitation deja fermee." };
  await recordSecurityEvent({ eventType: "TEACHER_INVITATION_REVOKED", metadata: { actorId: admin.id, invitationId } });
  return { ok: true, message: "Invitation revoquee." };
}

export async function getAdminActivityData(eventType?: string) {
  await requireRole([UserRole.ADMIN]);
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const safeType = eventType?.trim().slice(0, 60) || "";
  const [events, successCount, failureCount, uniqueSources] = await Promise.all([
    prisma.authEvent.findMany({
      where: safeType ? { eventType: safeType } : undefined,
      include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 150
    }),
    prisma.authEvent.count({ where: { eventType: "LOGIN_SUCCESS", createdAt: { gte: last24Hours } } }),
    prisma.authEvent.count({ where: { eventType: { in: FAILURE_EVENTS }, createdAt: { gte: last24Hours } } }),
    prisma.authEvent.findMany({
      where: { createdAt: { gte: last24Hours }, ipHash: { not: null } },
      distinct: ["ipHash"],
      select: { ipHash: true }
    })
  ]);
  return {
    successCount,
    failureCount,
    uniqueSources: uniqueSources.length,
    events: events.map(mapEvent)
  };
}

export async function getAdminSystemData() {
  await requireRole([UserRole.ADMIN]);
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [runtime, authEvents, rateLimits, users, classes, aiGenerations] = await Promise.all([
    getRuntimeStatus(),
    prisma.authEvent.count(),
    prisma.authRateLimit.count(),
    prisma.user.count(),
    prisma.class.count(),
    prisma.aIGeneration.findMany({
      where: { createdAt: { gte: monthStart } },
      select: {
        featureName: true,
        status: true,
        costEstimate: true,
        inputTokens: true,
        outputTokens: true,
        cacheHit: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" },
      take: 20_000
    })
  ]);
  const guardrails = getAIGuardrailConfig();
  const completed = aiGenerations.filter((entry) => entry.status === "COMPLETED");
  const spentUsd = completed.reduce((sum, entry) => sum + (entry.costEstimate ?? 0), 0);
  const featureTotals = new Map<string, { calls: number; cost: number }>();
  for (const entry of completed.filter((item) => !item.cacheHit)) {
    const current = featureTotals.get(entry.featureName) ?? { calls: 0, cost: 0 };
    current.calls += 1;
    current.cost += entry.costEstimate ?? 0;
    featureTotals.set(entry.featureName, current);
  }
  const featureLabels: Record<string, string> = {
    assistant_reply: "Assistant",
    essay_review: "Corrections",
    resource_summary: "Resumes",
    resource_sheet: "Fiches",
    resource_flashcards: "Flashcards",
    assistant_snapshot: "Syntheses",
    planning_guidance: "Planning",
    weekly_review: "Bilans",
    news_insight: "Actualites"
  };
  return {
    runtime,
    authEvents,
    rateLimits,
    users,
    classes,
    ai: {
      spentUsd,
      budgetUsd: guardrails.globalMonthlyBudgetUsd,
      budgetPercent: Math.min(100, (spentUsd / guardrails.globalMonthlyBudgetUsd) * 100),
      userBudgetUsd: guardrails.userMonthlyBudgetUsd,
      dailyLimit: guardrails.userDailyRequestLimit,
      paidCalls: completed.filter((entry) => !entry.cacheHit).length,
      todayPaidCalls: completed.filter((entry) => !entry.cacheHit && entry.createdAt >= dayStart).length,
      cacheHits: completed.filter((entry) => entry.cacheHit).length,
      blocked: aiGenerations.filter((entry) => entry.status === "BLOCKED").length,
      failed: aiGenerations.filter((entry) => entry.status === "FAILED").length,
      inputTokens: completed.reduce((sum, entry) => sum + (entry.inputTokens ?? 0), 0),
      outputTokens: completed.reduce((sum, entry) => sum + (entry.outputTokens ?? 0), 0),
      fastModel: getAIModel("assistant_reply" as AITaskId),
      qualityModel: getAIModel("essay_review" as AITaskId),
      features: Array.from(featureTotals.entries())
        .map(([feature, totals]) => ({ label: featureLabels[feature] ?? feature, ...totals }))
        .sort((left, right) => right.cost - left.cost)
    }
  };
}

export async function purgeAdminSecurityData() {
  const admin = await requireRole([UserRole.ADMIN]);
  const now = new Date();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const [events, limits, resetTokens, invitations] = await prisma.$transaction([
    prisma.authEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    prisma.authRateLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.teacherInvitation.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: cutoff } },
          { usedAt: { not: null }, createdAt: { lt: cutoff } }
        ]
      }
    })
  ]);
  await recordSecurityEvent({
    eventType: "SECURITY_LOG_PURGED",
    userId: admin.id,
    email: admin.email,
    metadata: {
      eventsDeleted: events.count,
      limitsDeleted: limits.count,
      resetTokensDeleted: resetTokens.count,
      invitationsDeleted: invitations.count
    }
  });
  return {
    ok: true,
    message: `${events.count} evenement(s), ${limits.count} limite(s), ${resetTokens.count} jeton(s) et ${invitations.count} invitation(s) expires supprimes.`
  };
}
