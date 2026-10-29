import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const base = process.env.DEMO_BASE_URL || "http://localhost:3001";
mkdirSync("demo-media", { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: "demo-media/raw", size: { width: 1280, height: 800 } },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const start = Date.now();
async function until(seconds) {
  const left = start + seconds * 1000 - Date.now();
  if (left > 0) await new Promise((r) => setTimeout(r, left));
}
try {
  await page.goto(base);
  await page.getByRole("heading", { name: "A private identity." }).waitFor();
  await until(12);
  await page.getByRole("link", { name: "Prepare local demonstration" }).click();
  await page
    .getByRole("link", { name: "1. Set up the membership group" })
    .click();
  await page.getByRole("button", { name: "Create five-member demo" }).click();
  await page.getByRole("button", { name: "Use member 1", exact: true }).click();
  await until(30);
  await page
    .getByRole("link", { name: "Open membership", exact: true })
    .click();
  await page
    .getByLabel("Backup password (at least 12 characters)", { exact: true })
    .fill("Disposable-demo-backup-2026");
  await page
    .getByLabel("Confirm backup password")
    .fill("Disposable-demo-backup-2026");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save encrypted backup" }).click();
  await downloaded;
  await page.getByRole("button", { name: "Continue to membership" }).click();
  await until(55);
  await page.getByRole("link", { name: "Set up the local group" }).click();
  await page.getByRole("link", { name: "Continue to proposal setup" }).click();
  await page
    .getByLabel("Proposal question")
    .fill("Should our DAO fund a community workshop?");
  await page.getByLabel("Voting duration in minutes").fill("1440");
  await until(67);
  await page.getByRole("button", { name: "2. Publish proposal" }).click();
  await page.getByRole("link", { name: "3. Open voting" }).click();
  await expect(
    page.getByText("Your identity is included", { exact: false }),
  ).toBeVisible();
  await page.locator(".voting-panel").scrollIntoViewIfNeeded();
  await until(80);
  await page.getByLabel("Yes — support this proposal").check();
  await page
    .getByRole("button", { name: "Create private voting proof", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Submit Yes vote" }),
  ).toBeVisible({ timeout: 120000 });
  await page.getByText("Inspect the public proof sent to the relay").click();
  await page.locator(".proof-json").scrollIntoViewIfNeeded();
  await until(103);
  await page.getByText("Inspect the public proof sent to the relay").click();
  await page.getByRole("button", { name: "Submit Yes vote" }).click();
  await expect(
    page.getByRole("heading", { name: "Vote confirmed", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await page.locator(".verified-proof").scrollIntoViewIfNeeded();
  await until(123);
  const receiptDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download receipt" }).click();
  await receiptDownload;
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Vote confirmed", exact: true }),
  ).toBeVisible();
  await page.getByText("Verify the proposal’s public details").click();
  await page.locator(".verified-proof").scrollIntoViewIfNeeded();
  await until(140);
  await page.getByText("Verify the proposal’s public details").click();
  await page.locator(".tally-grid").scrollIntoViewIfNeeded();
  await until(150);
  if (errors.length) throw new Error(errors.join("\n"));
  await context.close();
  await page.video().saveAs("demo-media/private-dao-voting-walkthrough.webm");
  writeFileSync(
    "demo-media/README.txt",
    "Actual local app recording, approximately 2 minutes 30 seconds. Silent walkthrough; use docs/demo-script.md for narration. All proofs and transactions shown are real local-chain operations. No MST deployment is implied.",
  );
  console.log("Saved demo-media/private-dao-voting-walkthrough.webm");
} finally {
  await browser.close();
}
