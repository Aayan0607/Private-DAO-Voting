import { test, expect } from "@playwright/test";
test("membership recovery, published proposal, real proof, relay, receipt and failures", async ({
  page,
  request,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("Failed to load resource"))
      errors.push(m.text());
  });
  await page.goto("/membership");
  await page.getByRole("button", { name: "I already have a backup" }).click();
  await expect(page.getByLabel("Encrypted backup file")).toBeVisible();
  await page
    .getByRole("button", { name: "Create a new identity instead" })
    .click();
  await page
    .getByRole("button", { name: "Create private identity", exact: true })
    .click();
  await page
    .getByLabel("Backup password (at least 12 characters)", { exact: true })
    .fill("local-test-password-2026");
  await page
    .getByLabel("Confirm backup password")
    .fill("local-test-password-2026");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save encrypted backup" }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();
  await page.getByRole("button", { name: "Continue to membership" }).click();
  const commitment = await page
    .getByLabel("Public membership ID (identity commitment)", { exact: true })
    .inputValue();
  await page
    .getByRole("button", { name: "Clear identity from this tab", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm clear identity" }).click();
  await page.getByRole("button", { name: "I already have a backup" }).click();
  await page.getByLabel("Encrypted backup file").setInputFiles(backupPath!);
  await page
    .getByLabel("Backup password", { exact: true })
    .fill("local-test-password-2026");
  await page
    .getByRole("button", { name: "Restore identity", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue to membership" }).click();
  await expect(
    page.getByLabel("Public membership ID (identity commitment)", {
      exact: true,
    }),
  ).toHaveValue(commitment);
  await page.goto("/demo");
  await page.getByRole("button", { name: "Create five-member demo" }).click();
  await page.getByLabel("Admit another public commitment").fill(commitment);
  await page.getByRole("button", { name: "Approve locally" }).click();
  await expect(
    page.getByRole("heading", { name: "6 approved locally" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Continue to proposal setup" }).click();
  const title = "Community workshop " + Date.now();
  await page.getByLabel("Proposal question").fill(title);
  await page.getByRole("button", { name: "2. Publish proposal" }).click();
  await expect(
    page.getByText("Proposal confirmed on the local blockchain.", {
      exact: true,
    }),
  ).toBeVisible({ timeout: 30000 });
  await page.getByRole("link", { name: "3. Open voting" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(
    page.getByText("Your identity is included", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create private voting proof", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Submit Yes vote" }),
  ).toBeVisible({ timeout: 120000 });
  await page.getByText("Inspect the public proof sent to the relay").click();
  const proof = JSON.parse((await page.locator(".proof-json").textContent())!);
  const id = await page.getByLabel("Choose a proposal").inputValue();
  const headers = { Origin: baseURL! };
  const malformed = await request.post("/api/voting/relay", {
    headers,
    data: { id, proof: { ...proof, points: Array(8).fill("0") } },
  });
  expect(malformed.status()).toBe(400);
  const altered = await request.post("/api/voting/relay", {
    headers,
    data: { id, proof: { ...proof, message: "2" } },
  });
  expect(altered.status()).toBe(400);
  const forbidden = await request.post("/api/voting/relay", {
    headers: { Origin: "https://other.example" },
    data: { id, proof },
  });
  expect(forbidden.status()).toBe(403);
  const oversized = await request.post("/api/voting/relay", {
    headers,
    data: { id, proof, padding: "x".repeat(20000) },
  });
  expect(oversized.status()).toBe(413);
  const sent = page.waitForRequest(
    (r) => r.url().endsWith("/api/voting/relay") && r.method() === "POST",
  );
  await page.getByRole("button", { name: "Submit Yes vote" }).click();
  const payload = (await sent).postDataJSON();
  expect(Object.keys(payload).sort()).toEqual(["id", "proof"]);
  expect(JSON.stringify(payload)).not.toContain(commitment);
  await expect(async () => {
    if (
      await page
        .getByRole("button", { name: "Check confirmation", exact: true })
        .isVisible()
    )
      await page
        .getByRole("button", { name: "Check confirmation", exact: true })
        .click();
    await expect(
      page.getByRole("heading", { name: "Vote confirmed", exact: true }),
    ).toBeVisible();
  }).toPass({ timeout: 30000 });
  await expect(page.locator(".tally-grid strong").nth(0)).toHaveText("1");
  await expect(page.locator(".tally-grid strong").nth(1)).toHaveText("0");
  const duplicate = await request.post("/api/voting/relay", {
    headers,
    data: { id, proof },
  });
  expect(duplicate.status()).toBe(409);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Vote confirmed", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/confirmed-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/confirmed-mobile.png",
    fullPage: true,
  });
  await page.goto("/membership");
  await page.getByRole("button", { name: "Continue to membership" }).click();
  await page
    .getByRole("button", { name: "Clear identity from this tab", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm clear identity" }).click();
  await page.goto("/demo");
  await page.getByRole("button", { name: "Use member 2", exact: true }).click();
  await page.goto("/vote");
  await expect(
    page.getByRole("heading", { name: "Vote confirmed", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("No — oppose this proposal").check();
  await page
    .getByRole("button", { name: "Create private voting proof", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Submit No vote" }),
  ).toBeVisible({ timeout: 120000 });
  await page.getByRole("button", { name: "Submit No vote" }).click();
  await expect(
    page.getByRole("heading", { name: "Vote confirmed", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".tally-grid strong").nth(0)).toHaveText("1");
  await expect(page.locator(".tally-grid strong").nth(1)).toHaveText("1");
  await page.goto("/membership");
  await page.getByRole("button", { name: "Continue to membership" }).click();
  await page
    .getByRole("button", { name: "Clear identity from this tab", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm clear identity" }).click();
  await page
    .getByRole("button", { name: "Create private identity", exact: true })
    .click();
  await page.goto("/vote");
  await expect(
    page.getByText("Your current identity is not in this proposal", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Create private voting proof",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
