/**
 * E2E smoke test: /styleguide renders the Kyle brand page.
 * Playwright runs against the dev server on port 3000.
 */
import { test, expect } from "@playwright/test";

test("styleguide page renders Kyle brand tokens", async ({ page }) => {
  await page.goto("/styleguide");

  // Should show the page heading
  await expect(page.getByRole("heading", { name: /styleguide/i })).toBeVisible();
});
