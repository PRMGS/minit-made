import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("homepage renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "MINIT MADE", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Apply Now" }).first()).toBeVisible();
  });

  test("faq, terms, and privacy render", async ({ page }) => {
    for (const path of ["/faq", "/terms", "/privacy"]) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
    }
  });

  test("unknown route 404s", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist");
    expect(res?.status()).toBe(404);
  });
});

test.describe("protected portals redirect when signed out", () => {
  const cases: Array<[string, string]> = [
    ["/admin/dashboard", "/admin/login"],
    ["/artist/dashboard", "/artist/login"],
    ["/crew/dashboard", "/crew/login"],
  ];

  for (const [path, loginPath] of cases) {
    test(`${path} redirects to ${loginPath}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${loginPath}\\?next=${encodeURIComponent(path)}`));
    });
  }

  test("login pages themselves are not redirected", async ({ page }) => {
    for (const path of ["/admin/login", "/artist/login", "/crew/login"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
  });
});

test.describe("apply flow", () => {
  test("steps through to Review without submitting", async ({ page }) => {
    await page.goto("/apply");
    await expect(page.getByRole("heading", { name: "Tell Us Who You Are" })).toBeVisible();

    await page.getByLabel("Legal Name *").fill("E2E Test");
    await page.getByLabel("Artist Name *").fill("E2E Tester");
    await page.getByLabel("Email *").fill("e2e-smoke-test@example.com");
    await page.getByLabel("Phone *").fill("5555555555");
    await page.getByLabel("City *").fill("Los Angeles");
    await page.getByLabel("Instagram *").fill("@e2esmoketest");
    await page.getByLabel("TikTok *").fill("@e2esmoketest");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Pick Your Lane" })).toBeVisible();
    await page.locator("button", { hasText: "Hanging Mic" }).first().click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Bring Your Sound" })).toBeVisible();
    await page.getByLabel("Song Title *").fill("E2E Smoke Test Track");
    await page.getByLabel("Artist Name (on track) *").fill("E2E Tester");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Dial In The Details" })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Level Up Your Moment" })).toBeVisible();
    await expect(page.getByText(/Running total: \$/)).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Terms & Consent" })).toBeVisible();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Proceed to Payment" })).toBeVisible();
    // Deliberately stop here — actually submitting creates a real booking row
    // and a real Stripe Checkout session, which this suite must never do.
  });
});
