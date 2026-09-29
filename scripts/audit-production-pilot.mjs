import pg from "pg";

import { loadMergedEnv } from "./load-env-files.mjs";

const env = {
  ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"]),
  ...process.env
};
const connectionString = (env.DIRECT_URL || env.DATABASE_URL || "").trim();

if (!/^postgres(?:ql)?:\/\//.test(connectionString)) {
  console.error("Une URL PostgreSQL de production est requise.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 15_000,
  statement_timeout: 60_000
});

try {
  await client.connect();
  const classes = await client.query(`
      SELECT c."name", c."yearLabel", c."track",
        COUNT(DISTINCT m."userId") FILTER (WHERE m."roleInClass" = 'student')::int AS students,
        COUNT(DISTINCT m."userId") FILTER (WHERE m."roleInClass" = 'teacher')::int AS teachers
      FROM "Class" c
      LEFT JOIN "ClassMembership" m ON m."classId" = c."id"
      GROUP BY c."id" ORDER BY c."createdAt" ASC
    `);
  const roles = await client.query(`SELECT "role", COUNT(*)::int AS count FROM "User" GROUP BY "role" ORDER BY "role"`);
  const content = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM "Resource") AS resources,
        (SELECT COUNT(*)::int FROM "Essay") AS essays,
        (SELECT COUNT(*)::int FROM "FlashcardDeck") AS decks,
        (SELECT COUNT(*)::int FROM "Flashcard") AS cards,
        (SELECT COUNT(*)::int FROM "StudySession" WHERE "status" = 'COMPLETED') AS completed_sessions
    `);
  const teacherWithoutClass = await client.query(`
      SELECT COUNT(*)::int AS count FROM "User" u
      WHERE u."role" = 'TEACHER' AND NOT EXISTS (
        SELECT 1 FROM "ClassMembership" m WHERE m."userId" = u."id" AND m."roleInClass" = 'teacher'
      )
    `);
  const studentWithoutProfile = await client.query(`
      SELECT COUNT(*)::int AS count FROM "User" u
      WHERE u."role" = 'STUDENT' AND NOT EXISTS (
        SELECT 1 FROM "StudentProfile" p WHERE p."userId" = u."id"
      )
    `);
  const invitations = await client.query(`
      SELECT COUNT(*)::int AS count FROM "TeacherInvitation"
      WHERE "usedAt" IS NULL AND "expiresAt" > NOW()
    `);

  console.log("Audit anonyme de la production");
  console.log("------------------------------");
  for (const prep of classes.rows) {
    console.log(`- ${prep.name} (${prep.yearLabel}, ${prep.track}) : ${prep.students} eleve(s), ${prep.teachers} professeur(s)`);
  }
  if (classes.rows.length === 0) console.log("- Aucun etablissement configure.");
  console.log(`Comptes : ${roles.rows.map((row) => `${row.role}=${row.count}`).join(", ") || "aucun"}`);
  const totals = content.rows[0];
  console.log(`Contenus : ${totals.resources} ressource(s), ${totals.essays} copie(s), ${totals.decks} deck(s), ${totals.cards} carte(s), ${totals.completed_sessions} bloc(s) valide(s).`);
  console.log(`Professeurs sans etablissement : ${teacherWithoutClass.rows[0].count}.`);
  console.log(`Eleves sans configuration terminee : ${studentWithoutProfile.rows[0].count}.`);
  console.log(`Invitations professeur actives : ${invitations.rows[0].count}.`);

  if (teacherWithoutClass.rows[0].count > 0) process.exitCode = 2;
} catch (error) {
  console.error(error instanceof Error ? error.message : "Audit impossible.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
