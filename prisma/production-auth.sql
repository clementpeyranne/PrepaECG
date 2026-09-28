-- Additive migration only. Re-running this file does not reset application data.
BEGIN;
CREATE TABLE IF NOT EXISTS "TeacherInvitation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "classId" TEXT NOT NULL REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherInvitation_tokenHash_key" ON "TeacherInvitation"("tokenHash");
CREATE INDEX IF NOT EXISTS "TeacherInvitation_email_classId_idx" ON "TeacherInvitation"("email", "classId");
CREATE TABLE IF NOT EXISTS "AuthRateLimit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "AuthRateLimit_expiresAt_idx" ON "AuthRateLimit"("expiresAt");
ALTER TABLE "TeacherInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuthRateLimit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "submissionKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Resource_submissionKey_key" ON "Resource"("submissionKey");
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "deduplicationKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Essay_deduplicationKey_key" ON "Essay"("deduplicationKey");
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "Essay" ADD COLUMN IF NOT EXISTS "planningEntryId" TEXT;
CREATE INDEX IF NOT EXISTS "Essay_studentId_planningEntryId_idx" ON "Essay"("studentId", "planningEntryId");
ALTER TABLE "FlashcardReview" ADD COLUMN IF NOT EXISTS "planningEntryId" TEXT;
CREATE INDEX IF NOT EXISTS "FlashcardReview_userId_planningEntryId_idx" ON "FlashcardReview"("userId", "planningEntryId");
COMMIT;
