import { expect, type Locator, type Page } from "@playwright/test";
import type { RegistrationUser } from "../support/ai/schemas";
import { SelfHealingLocator } from "../support/self-healing/self-healing-locator";
import type { HealingCandidate, HealingEvent } from "../support/self-healing/healing-candidate";

export class RegistrationPage {
  private readonly healing = new SelfHealingLocator();

  constructor(private readonly page: Page) {}

  get healingEvents(): HealingEvent[] {
    return this.healing.healingEvents;
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async register(user: RegistrationUser): Promise<void> {
    await this.fill("firstName", this.page.getByTestId("first-name"), [
      {
        strategy: "accessible-label",
        reason: "The first-name test id changed, but the accessible label remained stable.",
        locate: (page) => page.getByLabel("First name")
      },
      {
        strategy: "field-name",
        reason: "The semantic name attribute still identifies the expected field.",
        locate: (page) => page.locator("input[name='firstName']")
      }
    ], user.firstName);

    await this.page.getByTestId("last-name").fill(user.lastName);
    await this.page.getByTestId("email").fill(user.email);
    await this.page.getByTestId("password").fill(user.password);
    await this.page.getByTestId("company").fill(user.company);
    await this.page.getByTestId("role").selectOption(user.role);
    await this.page.getByTestId("country").selectOption(user.country);
    await this.page.getByTestId("create-account").click();
  }

  async expectSuccessfulRegistration(user: RegistrationUser): Promise<void> {
    await expect(this.page.getByTestId("registration-result")).toBeVisible();
    await expect(this.page.getByTestId("created-user")).toHaveText(`${user.firstName} ${user.lastName}`);
    await expect(this.page.getByTestId("created-email")).toHaveText(user.email);
    await expect(this.page.getByTestId("created-company")).toHaveText(user.company);
    await expect(this.page.getByTestId("created-role")).toHaveText(user.role);
    await expect(this.page.getByTestId("created-country")).toHaveText(user.country);
  }

  private async fill(
    target: string,
    primaryLocator: Locator,
    candidates: HealingCandidate[],
    value: string
  ): Promise<void> {
    const field = await this.healing.find(this.page, target, primaryLocator, candidates);
    await field.fill(value);
  }
}
