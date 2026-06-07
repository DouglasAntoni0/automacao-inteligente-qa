import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { env } from "../config/env";
import {
  generatedRegistrationUserSchema,
  registrationUserSchema,
  type RegistrationUser
} from "./schemas";

export class OpenAiClient {
  private readonly client?: OpenAI;

  constructor() {
    if (env.openAiApiKey) {
      this.client = new OpenAI({
        apiKey: env.openAiApiKey,
        timeout: env.aiRequestTimeoutMs
      });
    }
  }

  async generateRegistrationUser(): Promise<RegistrationUser> {
    if (!this.client) {
      throw new Error("OPENAI_API_KEY is required when USE_OPENAI_DATA=true.");
    }

    const response = await this.client.responses.parse({
      model: env.openAiModel,
      input: [
        {
          role: "system",
          content:
            "Generate synthetic QA data only. Do not use real people, real companies, or production domains."
        },
        {
          role: "user",
          content:
            "Create one B2B SaaS registration profile. Use example.test for email, a strong test password, and values that fit the provided schema."
        }
      ],
      reasoning: {
        effort: "low"
      },
      text: {
        format: zodTextFormat(generatedRegistrationUserSchema, "registration_user"),
        verbosity: "low"
      }
    });

    if (!response.output_parsed) {
      throw new Error(`OpenAI returned no parsed registration user. response_id=${response.id}`);
    }

    return registrationUserSchema.parse(response.output_parsed);
  }
}
