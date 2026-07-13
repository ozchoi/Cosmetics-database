import { expect, test } from "@playwright/test";

const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

test("searches ingredients in Chinese and English", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("搜尋產品、品牌、條碼或成分").fill("甘油");
  await page.getByRole("button", { name: "搜尋" }).click();
  await expect(page.getByRole("heading", { name: "成分", exact: true })).toBeVisible();
  await expect(page.getByText("Glycerin", { exact: true }).first()).toBeVisible();

  await page.getByLabel("搜尋字詞").fill("Glycerin");
  await page.getByRole("button", { name: "搜尋" }).click();
  await expect(page.getByText("甘油", { exact: true }).first()).toBeVisible();
});

test("uploads a label, runs deterministic OCR, submits contribution, and reviews as admin", async ({
  page,
}) => {
  await page.goto("/submit");
  await page.getByLabel("選擇產品相片").setInputFiles({
    name: "test-label.png",
    mimeType: "image/png",
    buffer: pngBytes,
  });
  await expect(page.getByRole("button", { name: "執行本地 OCR" })).toBeEnabled();
  await page.getByRole("button", { name: "執行本地 OCR" }).click();
  await expect(page.getByText("OCR 完成")).toBeVisible();
  await expect(page.getByText("Niacinamide", { exact: true })).toBeVisible();

  await page.getByLabel("產品名稱").fill("測試保濕精華");
  await page.getByLabel("品牌").fill("測試品牌");
  await page.getByLabel("提交成分文字，但不保存原圖").check();
  await page.getByLabel(/我確認相片由我拍攝/).check();
  const submitButton = page.getByRole("button", { name: "提交待審核" });
  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ force: true });
  await expect(page.getByText("已建立待審核提交")).toBeVisible();

  await page.goto("/admin/login");
  await page.getByLabel("電郵").fill("admin@example.test");
  await page.getByLabel("密碼").fill("change-me-in-dev");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page.getByRole("heading", { name: "審核工作台" })).toBeVisible();

  await page.goto("/admin/pending-submissions");
  await expect(page.getByText("測試保濕精華")).toBeVisible();
  await page.getByPlaceholder("審核備註").fill("E2E approval");
  await page.getByRole("button", { name: "批准" }).click();
  await expect(page.getByText("沒有待審核提交")).toBeVisible();
});

test("opens public product page with bilingual ingredients and provenance", async ({ page }) => {
  await page.goto("/products/mist-spring-hydrating-serum");
  await expect(page.getByRole("heading", { name: "霧泉保濕精華", exact: true })).toBeVisible();
  await expect(page.getByText("Glycerin", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("來源標籤及配方歷史")).toBeVisible();
});
