import { test, expect } from "@playwright/test";
test("preview is labelled, rejects sample repeats and stays isolated from real voting", async ({
  page,
}) => {
  const apiCalls: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/voting")) apiCalls.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/preview");
  await expect(
    page.getByText("Interactive preview — simulated transactions", {
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(() =>
    sessionStorage.setItem("pdv.preview-test-sentinel", "preserved"),
  );
  await page.getByRole("button", { name: "Approve Alex in preview" }).click();
  await page.getByRole("button", { name: "Publish sample proposal" }).click();
  await page.getByLabel("No — oppose the workshop").check();
  await page.getByRole("button", { name: "Simulate first vote" }).click();
  await expect(
    page.getByRole("heading", { name: "Simulated result", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".tally-grid strong").nth(1)).toHaveText("1");
  await page.getByRole("button", { name: "Try Alex voting again" }).click();
  await expect(
    page.getByText("Simulated rejection: Alex", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".tally-grid strong").nth(2)).toHaveText("1");
  await page.getByRole("button", { name: "Try unapproved member Sam" }).click();
  await expect(
    page.getByText("Simulated rejection: Sam", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Admit Sam after publication" })
    .click();
  await expect(
    page.getByText("Simulated admission: Sam", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/preview-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Reset preview", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Approve a sample member" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("pdv.preview-test-sentinel"),
    ),
  ).toBe("preserved");
  expect(apiCalls).toEqual([]);
  expect(errors).toEqual([]);
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: "Two ways to explore" }),
  ).toBeVisible();
});
