-- Additive AI metering and guardrail migration. Re-running it does not reset data.
BEGIN;
ALTER TABLE "AIGeneration" ADD COLUMN IF NOT EXISTS "inputTokens" INTEGER;
ALTER TABLE "AIGeneration" ADD COLUMN IF NOT EXISTS "cachedInputTokens" INTEGER;
ALTER TABLE "AIGeneration" ADD COLUMN IF NOT EXISTS "outputTokens" INTEGER;
ALTER TABLE "AIGeneration" ADD COLUMN IF NOT EXISTS "durationMs" INTEGER;
ALTER TABLE "AIGeneration" ADD COLUMN IF NOT EXISTS "requestHash" TEXT;
ALTER TABLE "AIGeneration" ADD COLUMN IF NOT EXISTS "requestKey" TEXT;
ALTER TABLE "AIGeneration" ADD COLUMN IF NOT EXISTS "responseJson" JSONB;
ALTER TABLE "AIGeneration" ADD COLUMN IF NOT EXISTS "cacheHit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AIGeneration" ADD COLUMN IF NOT EXISTS "blockedReason" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "AIGeneration_requestKey_key" ON "AIGeneration"("requestKey");
CREATE INDEX IF NOT EXISTS "AIGeneration_status_createdAt_idx" ON "AIGeneration"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "AIGeneration_userId_requestHash_createdAt_idx" ON "AIGeneration"("userId", "requestHash", "createdAt");
COMMIT;
