import fallbackRegistrationUser from "../../fixtures/fallback-registration-user.json";
import { env } from "../config/env";
import { OpenAiClient } from "./openai-client";
import { registrationUserSchema, type RegistrationUser } from "./schemas";

export class AiTestDataFactory {
  constructor(private readonly openAiClient = new OpenAiClient()) {}

  async buildRegistrationUser(): Promise<RegistrationUser> {
    if (!env.useOpenAiData) {
      return this.buildFallbackUser();
    }

    try {
      return await this.openAiClient.generateRegistrationUser();
    } catch (error) {
      if (!env.allowAiFallback) {
        throw error;
      }

      console.warn(`[AI_DATA_FALLBACK] ${error instanceof Error ? error.message : String(error)}`);
      return this.buildFallbackUser();
    }
  }

  private buildFallbackUser(): RegistrationUser {
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return registrationUserSchema.parse({
      ...fallbackRegistrationUser,
      email: `qa-${runId}@example.test`,
      company: `${fallbackRegistrationUser.company} ${runId}`
    });
  }
}
