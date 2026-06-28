import { UserRole, type User } from "@prisma/client";
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";

import { getPasswordResetMode, getPublicAppUrl, isDemoModeEnabled } from "./app-config";
import { prisma } from "./db";
import { ensureReferenceData } from "./reference-data";

const AUTH_COOKIE_NAME = "prepa_auth";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;
const PASSWORD_RESET_DURATION_MS = 1000 * 60 * 60;

function getAuthSecret() {
  const configuredSecret = process.env.AUTH_SECRET?.trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  if (isDemoModeEnabled()) {
    return "dev-prepa-ecg-os-secret-change-me";
  }

  throw new Error("AUTH_SECRET_REQUIRED");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, "hex");

  if (stored.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(stored, derived);
}

function createSessionToken(userId: string, expiresAt: number) {
  const payload = `${userId}.${expiresAt}`;
  const signature = createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function hashPasswordResetToken(token: string) {
  return createHmac("sha256", getAuthSecret()).update(`password-reset:${token}`).digest("hex");
}

function buildPasswordResetUrl(token: string) {
  return `${getPublicAppUrl().replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}

function parseSessionToken(token: string) {
  const [userId, expiresAtRaw, signature] = token.split(".");
  if (!userId || !expiresAtRaw || !signature) {
    return null;
  }

  const payload = `${userId}.${expiresAtRaw}`;
  const expectedSignature = createHmac("sha256", getAuthSecret()).update(payload).digest("hex");

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }

  return {
    userId,
    expiresAt
  };
}

async function writeSessionCookie(userId: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, createSessionToken(userId, expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

const getUserById = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId }
  });
});

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = parseSessionToken(token);
  if (!session) {
    cookieStore.delete(AUTH_COOKIE_NAME);
    return null;
  }

  return getUserById(session.userId);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireCurrentUser();
  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export async function registerUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  accessCode: string;
}) {
  const email = normalizeEmail(input.email);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (!firstName || !lastName || !email || !input.password.trim()) {
    return {
      ok: false as const,
      message: "Tous les champs sont obligatoires."
    };
  }

  if (input.password.trim().length < 8) {
    return {
      ok: false as const,
      message: "Le mot de passe doit contenir au moins 8 caracteres."
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return {
      ok: false as const,
      message: "Un compte existe deja avec cette adresse email."
    };
  }

  await ensureReferenceData();
  const normalizedAccessCode = input.accessCode.trim().toUpperCase();

  let prepClass = await prisma.class.findUnique({
    where: { accessCode: normalizedAccessCode }
  });

  if (!prepClass && !isDemoModeEnabled()) {
    const classCount = await prisma.class.count();

    if (classCount === 0 && normalizedAccessCode) {
      prepClass = await prisma.class.create({
        data: {
          name: "Prepa ECG",
          yearLabel: String(new Date().getFullYear()),
          track: "ECG",
          accessCode: normalizedAccessCode
        }
      });
    }
  }

  if (!prepClass) {
    return {
      ok: false as const,
      message: "Le code d'etablissement n'a pas ete reconnu."
    };
  }

  const passwordHash = hashPassword(input.password.trim());

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: input.role
    }
  });

  await prisma.classMembership.create({
    data: {
      userId: user.id,
      classId: prepClass.id,
      roleInClass: input.role === UserRole.TEACHER ? "teacher" : "student"
    }
  });

  await writeSessionCookie(user.id);

  return {
    ok: true as const,
    user
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!email || !password) {
    return {
      ok: false as const,
      message: "Email et mot de passe sont obligatoires."
    };
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return {
      ok: false as const,
      message: "Identifiants invalides."
    };
  }

  await writeSessionCookie(user.id);

  return {
    ok: true as const,
    user
  };
}

export async function requestPasswordReset(emailInput: string) {
  const email = normalizeEmail(emailInput);

  if (!email) {
    return {
      ok: false as const,
      message: "Merci d'indiquer ton email."
    };
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  let resetLink: string | null = null;

  if (user) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_DURATION_MS);

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    if (getPasswordResetMode() === "direct-link") {
      resetLink = buildPasswordResetUrl(rawToken);
    }
  }

  return {
    ok: true as const,
    message:
      getPasswordResetMode() === "direct-link"
        ? "Si un compte existe, le lien de reinitialisation est pret ci-dessous."
        : "Si un compte existe, la demande de reinitialisation a bien ete enregistree.",
    resetLink
  };
}

async function getPasswordResetTokenRecord(token: string) {
  if (!token.trim()) {
    return null;
  }

  return prisma.passwordResetToken.findUnique({
    where: {
      tokenHash: hashPasswordResetToken(token.trim())
    },
    include: {
      user: true
    }
  });
}

export async function getPasswordResetTokenState(token: string) {
  if (!token.trim()) {
    return { status: "missing" as const };
  }

  const record = await getPasswordResetTokenRecord(token);

  if (!record) {
    return { status: "invalid" as const };
  }

  if (record.usedAt) {
    return { status: "used" as const };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    return { status: "expired" as const };
  }

  return {
    status: "valid" as const,
    userId: record.userId
  };
}

export async function resetPasswordFromToken(input: { token: string; password: string }) {
  const password = input.password.trim();

  if (password.length < 8) {
    return {
      ok: false as const,
      message: "Le mot de passe doit contenir au moins 8 caracteres."
    };
  }

  const tokenState = await getPasswordResetTokenState(input.token);
  if (tokenState.status !== "valid") {
    return {
      ok: false as const,
      message: "Le lien de reinitialisation n'est plus valide."
    };
  }

  const record = await getPasswordResetTokenRecord(input.token);
  if (!record) {
    return {
      ok: false as const,
      message: "Le lien de reinitialisation n'est plus valide."
    };
  }

  const passwordHash = hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: record.userId,
        id: { not: record.id }
      }
    })
  ]);

  await writeSessionCookie(record.userId);

  return {
    ok: true as const,
    user: record.user
  };
}

export async function getUserLandingPath(user: Pick<User, "role" | "id">) {
  if (user.role === UserRole.TEACHER || user.role === UserRole.ADMIN) {
    return "/teacher/resources";
  }

  const profile = await getStudentProfileByUserId(user.id);

  return profile ? "/dashboard" : "/onboarding";
}

const getStudentProfileByUserId = cache(async (userId: string) => {
  return prisma.studentProfile.findUnique({
    where: { userId }
  });
});

const getCurrentUserClassCached = cache(async (userId: string) => {
  return prisma.classMembership.findFirst({
    where: { userId },
    include: { class: true },
    orderBy: { createdAt: "asc" }
  });
});

export async function getCurrentUserClass(userId: string) {
  return getCurrentUserClassCached(userId);
}
