import { createHash, randomBytes } from "node:crypto";
import { loadMergedEnv } from "./load-env-files.mjs";

const prod = process.argv.includes("--prod");
const env = loadMergedEnv(prod ? [".env", ".env.local", ".env.production", ".env.production.local"] : [".env", ".env.local"]);
for (const [key, value] of Object.entries(env)) if (!(key in process.env)) process.env[key] = value;
const flag = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? "" : (process.argv[index + 1] || "").trim();
};
const email = flag("email").toLowerCase();
const accessCode = flag("code").toUpperCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !accessCode) {
  console.error('Usage: npm run teacher:invite -- --email "prof@exemple.fr" --code "PREPA" [--revoke] [--prod]');
  process.exit(1);
}
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();
try {
  const prep = await prisma.class.findUnique({ where: { accessCode } });
  if (!prep) throw new Error("Etablissement inconnu. Cree-le d'abord avec establishment:create.");
  if (process.argv.includes("--revoke")) {
    await prisma.teacherInvitation.updateMany({ where: { email, classId: prep.id, usedAt: null }, data: { usedAt: new Date() } });
    console.log("Invitations non utilisees revoquees. Le compte existant, s'il existe, n'a pas ete modifie.");
  } else {
    if (await prisma.user.findUnique({ where: { email } })) throw new Error("Cette adresse possede deja un compte. Aucun role n'a ete modifie.");
    const url = new URL("/signup", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    if (prod && (url.protocol !== "https:" || url.hostname === "ton-domaine.fr")) throw new Error("Configure NEXT_PUBLIC_APP_URL avec le vrai domaine HTTPS.");
    const token = randomBytes(32).toString("hex");
    await prisma.$transaction([
      prisma.teacherInvitation.updateMany({ where: { email, classId: prep.id, usedAt: null }, data: { usedAt: new Date() } }),
      prisma.teacherInvitation.create({ data: {
        email, classId: prep.id, tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      } })
    ]);
    url.searchParams.set("invitation", token);
    url.searchParams.set("email", email);
    url.searchParams.set("accessCode", accessCode);
    console.log("Invitation valable 7 jours, utilisable une seule fois par cette adresse dans cet etablissement.");
    console.log("Transmets ce lien personnel au professeur par un canal prive. Il n'a pas ete envoye automatiquement :");
    console.log(url.href);
  }
} catch (error) {
  console.error(error instanceof Error && !error.message.includes("prisma.") ? error.message : "Creation impossible. Verifie la connexion et la mise a jour de la base.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
