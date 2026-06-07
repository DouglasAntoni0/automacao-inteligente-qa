import { expect, test } from "@playwright/test";
import { RegistrationPage } from "../pages/registration-page";
import { AiTestDataFactory } from "../support/ai/ai-test-data-factory";
import { sanitizeRegistrationUser } from "../support/ai/schemas";

test.describe("AI-assisted registration flow", () => {
  test("registers a synthetic user and heals a drifted selector", async ({ page }, testInfo) => {
    const user = await new AiTestDataFactory().buildRegistrationUser();
    const registrationPage = new RegistrationPage(page);

    await testInfo.attach("registration-user", {
      body: JSON.stringify(sanitizeRegistrationUser(user), null, 2),
      contentType: "application/json"
    });

    await registrationPage.goto();
    await registrationPage.register(user);
    await registrationPage.expectSuccessfulRegistration(user);

    await testInfo.attach("self-healing-events", {
      body: JSON.stringify(registrationPage.healingEvents, null, 2),
      contentType: "application/json"
    });

    expect(registrationPage.healingEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: "firstName",
          strategy: "accessible-label"
        })
      ])
    );
  });
});
