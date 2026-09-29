-- Additive legal-acceptance migration. Re-running it does not reset data.
BEGIN;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyAcknowledgedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyVersion" TEXT;
COMMIT;
