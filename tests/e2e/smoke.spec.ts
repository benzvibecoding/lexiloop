import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  // @ts-expect-error - stash for assertion at test end
  page.context().__errors = errors;
});

test.afterEach(async ({ page }) => {
  // @ts-expect-error - read stashed errors
  const errors: string[] = page.context().__errors ?? [];
  const real = errors.filter(
    (e) => !e.includes("favicon") && !e.includes("chrome-extension"),
  );
  expect(real, JSON.stringify(real.slice(0, 3))).toEqual([]);
});

test("landing renders hero + demo + faq", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /nhớ lâu mỗi ngày/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /học ngay/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /lật thẻ/i }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /hỏi đáp/i })).toBeVisible();
});

test("onboarding 3 steps suggests decks", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /^IELTS$/ }).click();
  await page.getByRole("button", { name: /^B1$/ }).click();
  await page.getByRole("button", { name: /^10$/ }).click();
  await expect(page.getByRole("heading", { name: /gợi ý cho bạn/i })).toBeVisible();
});

test("library add -> decks -> review -> study one card", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: /thư viện deck mẫu/i })).toBeVisible();
  await page.getByRole("button", { name: /thêm vào của tôi|thêm nữa/i }).first().click();
  await expect(page.getByRole("status").first()).toContainText(/đã thêm/i);

  await page.goto("/decks");
  await expect(page.getByRole("link", { name: /mở/i }).first()).toBeVisible();

  await page.goto("/review");
  await expect(page.getByRole("heading", { name: /ôn tập hôm nay/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /bắt đầu ôn/i })).toBeVisible();

  await page.goto("/study?mode=flashcard");
  const flip = page.getByRole("button", { name: /lật thẻ/i });
  await expect(flip).toBeVisible({ timeout: 15000 });
  await flip.click();
  await page.getByRole("button", { name: /^nhớ/i }).click();
  await expect(page.getByText(/\/ \d+|hết thẻ|tổng kết/i).first()).toBeVisible();
});

test("leaderboard guest sees member prompt", async ({ page }) => {
  await page.goto("/leaderboard");
  await expect(page.getByRole("heading", { name: /xếp hạng|dành cho thành viên/i })).toBeVisible();
});

test("admin guest sees locked page", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /quản trị|khu vực quản trị/i })).toBeVisible();
});

test("mobile viewport has bottom tabs", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/dashboard");
  await expect(page.getByRole("navigation", { name: /điều hướng chính/i })).toBeVisible();
});

test("settings persists newPerDay", async ({ page }) => {
  await page.goto("/settings");
  const input = page.getByLabel(/từ mới \/ ngày/i);
  await expect(input).toBeVisible({ timeout: 15000 });
  await input.fill("15");
  await page.reload();
  await expect(page.getByLabel(/từ mới \/ ngày/i)).toHaveValue("15");
});
