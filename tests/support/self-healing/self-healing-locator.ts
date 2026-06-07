import { expect, type Locator, type Page } from "@playwright/test";
import { env } from "../config/env";
import type { HealingCandidate, HealingEvent } from "./healing-candidate";

export class SelfHealingLocator {
  private readonly events: HealingEvent[] = [];

  constructor(private readonly probeTimeoutMs = 800) {}

  get healingEvents(): HealingEvent[] {
    return [...this.events];
  }

  async find(
    page: Page,
    target: string,
    primaryLocator: Locator,
    candidates: HealingCandidate[]
  ): Promise<Locator> {
    if (!env.selfHealingEnabled || (await this.isUsable(primaryLocator))) {
      return primaryLocator;
    }

    for (const candidate of candidates) {
      const candidateLocator = candidate.locate(page);

      if (await this.isUsable(candidateLocator)) {
        this.events.push({
          target,
          strategy: candidate.strategy,
          reason: candidate.reason
        });

        return candidateLocator;
      }
    }

    return primaryLocator;
  }

  private async isUsable(locator: Locator): Promise<boolean> {
    try {
      await expect(locator.first()).toBeVisible({ timeout: this.probeTimeoutMs });
      return true;
    } catch {
      return false;
    }
  }
}
