import type { AITaskId } from "./ai-task-catalog";

export type AIModelTier = "fast" | "quality";

export type AIUsage = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
};

type ModelPricing = {
  input: number;
  cachedInput: number;
  output: number;
};

const DEFAULT_FAST_MODEL = "gpt-6-luna";
const DEFAULT_QUALITY_MODEL = "gpt-6.1-sol";

const DEFAULT_PRICING: Record<AIModelTier, ModelPricing> = {
  fast: { input: 0.1, cachedInput: 0.01, output: 0.5 },
  quality: { input: 2, cachedInput: 0.1, output: 10 }
};

const CACHE_TTL_SECONDS: Record<AITaskId, number> = {
  assistant_reply: 10 * 60,
  essay_review: 30 * 24 * 60 * 60,
  planning_guidance: 6 * 60 * 60,
  resource_summary: 30 * 24 * 60 * 60,
  resource_sheet: 30 * 24 * 60 * 60,
  resource_flashcards: 30 * 24 * 60 * 60,
  assistant_snapshot: 24 * 60 * 60,
  weekly_review: 24 * 60 * 60,
  news_insight: 24 * 60 * 60
};

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function positiveInteger(value: string | undefined, fallback: number) {
  return Math.max(1, Math.floor(positiveNumber(value, fallback)));
}

export function getAIModelTier(taskId: AITaskId): AIModelTier {
  return taskId === "essay_review" ? "quality" : "fast";
}

export function getAIModel(taskId: AITaskId) {
  const tier = getAIModelTier(taskId);
  if (tier === "quality") {
    return process.env.OPENAI_MODEL_QUALITY?.trim() || DEFAULT_QUALITY_MODEL;
  }
  return process.env.OPENAI_MODEL_FAST?.trim() || DEFAULT_FAST_MODEL;
}

export function getAIGuardrailConfig() {
  return {
    globalMonthlyBudgetUsd: positiveNumber(process.env.AI_MONTHLY_BUDGET_USD, 75),
    userMonthlyBudgetUsd: positiveNumber(process.env.AI_USER_MONTHLY_BUDGET_USD, 5),
    userDailyRequestLimit: positiveInteger(process.env.AI_USER_DAILY_REQUEST_LIMIT, 120),
    duplicateWindowSeconds: positiveInteger(process.env.AI_DUPLICATE_WINDOW_SECONDS, 20),
    globalConcurrentLimit: positiveInteger(process.env.AI_GLOBAL_CONCURRENT_LIMIT, 20),
    userConcurrentLimit: positiveInteger(process.env.AI_USER_CONCURRENT_LIMIT, 2)
  };
}

export function getAICacheTtlSeconds(taskId: AITaskId) {
  return CACHE_TTL_SECONDS[taskId];
}

function getPricing(tier: AIModelTier): ModelPricing {
  const defaults = DEFAULT_PRICING[tier];
  const prefix = tier === "fast" ? "AI_FAST" : "AI_QUALITY";
  return {
    input: positiveNumber(process.env[`${prefix}_INPUT_USD_PER_M`], defaults.input),
    cachedInput: positiveNumber(process.env[`${prefix}_CACHED_INPUT_USD_PER_M`], defaults.cachedInput),
    output: positiveNumber(process.env[`${prefix}_OUTPUT_USD_PER_M`], defaults.output)
  };
}

export function estimateAICostUsd(taskId: AITaskId, usage: AIUsage) {
  const pricing = getPricing(getAIModelTier(taskId));
  const uncachedInput = Math.max(0, usage.inputTokens - usage.cachedInputTokens);
  return (
    uncachedInput * pricing.input +
    usage.cachedInputTokens * pricing.cachedInput +
    usage.outputTokens * pricing.output
  ) / 1_000_000;
}

export function parseAIUsage(payload: Record<string, unknown>): AIUsage {
  const usage = payload.usage && typeof payload.usage === "object"
    ? payload.usage as Record<string, unknown>
    : {};
  const details = usage.input_tokens_details && typeof usage.input_tokens_details === "object"
    ? usage.input_tokens_details as Record<string, unknown>
    : {};
  return {
    inputTokens: Math.max(0, Number(usage.input_tokens) || 0),
    cachedInputTokens: Math.max(0, Number(details.cached_tokens) || 0),
    outputTokens: Math.max(0, Number(usage.output_tokens) || 0)
  };
}

export function startOfUtcDay(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function startOfUtcMonth(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
