import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "./db";

export async function consumeAuthLimit(subject: string, limit: number, windowMs = 15 * 60 * 1000) {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET_REQUIRED");
  const window = Math.floor(Date.now() / windowMs);
  const id = createHmac("sha256", secret).update(`auth-limit:${subject}:${window}`).digest("hex");
  await prisma.authRateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const args = {
    where: { id },
    create: { id, count: 1, expiresAt: new Date((window + 1) * windowMs) },
    update: { count: { increment: 1 } }
  };
  let entry;
  try {
    entry = await prisma.authRateLimit.upsert(args);
  } catch (error) {
    // Prisma can emulate upsert: handle a concurrent first request for the same key.
    if (!(error && typeof error === "object" && "code" in error && error.code === "P2002")) throw error;
    entry = await prisma.authRateLimit.update({ where: { id }, data: args.update });
  }
  return entry.count <= limit;
}

export async function allowAuthRequest(action: string, email: string) {
  const requestHeaders = await headers();
  // Vercel supplies this value. Do not trust a caller-provided forwarded address elsewhere.
  const ip = process.env.VERCEL ? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() : null;
  if (!await consumeAuthLimit(`${action}:ip:${ip || "shared"}`, action === "reset" ? 30 : 300)) return false;
  return consumeAuthLimit(`${action}:email:${email}`, action === "reset" ? 3 : 10);
}
