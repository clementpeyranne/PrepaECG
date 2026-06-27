import { PrismaClient } from "@prisma/client";

function readFlag(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) {
    return "";
  }

  return String(process.argv[index + 1] ?? "").trim();
}

const name = readFlag("name");
const yearLabel = readFlag("year") || "2026";
const track = readFlag("track") || "ECG";
const accessCode = readFlag("code").toUpperCase();

if (!name || !accessCode) {
  console.error("Usage : npm run establishment:create -- --name \"Nom\" --code \"CODE\" [--year \"2026\"] [--track \"ECG\"]");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const prepClass = await prisma.class.upsert({
    where: {
      accessCode
    },
    update: {
      name,
      yearLabel,
      track
    },
    create: {
      name,
      yearLabel,
      track,
      accessCode
    }
  });

  console.log("Etablissement pret.");
  console.log(`- Nom : ${prepClass.name}`);
  console.log(`- Annee : ${prepClass.yearLabel}`);
  console.log(`- Filiere : ${prepClass.track}`);
  console.log(`- Code d'acces : ${prepClass.accessCode}`);
} finally {
  await prisma.$disconnect();
}
