import { config as loadEnv } from "dotenv";

loadEnv();

const booleanFromEnv = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "y"].includes(value.toLowerCase());
};

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  if (value === undefined) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const env = {
  baseUrl: process.env.BASE_URL ?? "http://127.0.0.1:4173",
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5.5",
  useOpenAiData: booleanFromEnv(process.env.USE_OPENAI_DATA, false),
  allowAiFallback: booleanFromEnv(process.env.ALLOW_AI_FALLBACK, true),
  aiRequestTimeoutMs: numberFromEnv(process.env.AI_REQUEST_TIMEOUT_MS, 20_000),
  selfHealingEnabled: booleanFromEnv(process.env.SELF_HEALING_ENABLED, true)
};
