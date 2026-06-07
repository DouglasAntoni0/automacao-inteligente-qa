import type { Locator, Page } from "@playwright/test";

export type HealingCandidate = {
  strategy: string;
  reason: string;
  locate: (page: Page) => Locator;
};

export type HealingEvent = {
  target: string;
  strategy: string;
  reason: string;
};
