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
  await expect(page.getByRole("status")).toContainText("OCR 完成", { timeout: 15_000 });
  await expect(page.getByText("Niacinamide", { exact: true }).first()).toBeVisible();

  await page.getByLabel("產品名稱").fill("測試保濕精華");
  await page.getByLabel("品牌").fill("測試品牌");
  await page.getByLabel("比對現有產品版本（可選）").selectOption("pv-mist-spring-2026-hk-a");
  await expect(page.getByText("可能改配方比對")).toBeVisible();
  await expect(page.getByText("需覆核差異")).toBeVisible();
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
  await expect(page.getByText("可能改配方覆核任務")).toBeVisible();
  await page.getByPlaceholder("審核備註").fill("E2E approval");
  await page.getByRole("button", { name: "批准" }).click();
  await expect(page.getByText("沒有待審核提交")).toBeVisible();
});

test("browses products by freshness without an overall safe-products filter", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "瀏覽產品" })).toBeVisible();
  await expect(page.getByText("沒有「安全產品」篩選")).toBeVisible();
  await expect(page.getByText("霧泉保濕精華").first()).toBeVisible();

  await page.getByLabel("配方新鮮度").selectOption("舊配方");
  await page.getByRole("button", { name: "套用" }).click();
  await expect(page.getByText("香港版 2021-09")).toBeVisible();
  await expect(page.getByText("此配方資料可能已過時")).toBeVisible();
});

test("opens public product page with bilingual ingredients and provenance", async ({ page }) => {
  await page.goto("/products/mist-spring-hydrating-serum");
  await expect(page.getByRole("heading", { name: "霧泉保濕精華", exact: true })).toBeVisible();
  await expect(page.getByText("Glycerin", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("來源標籤及配方歷史")).toBeVisible();
});

test("shows source registry metadata and third-party website handling", async ({ page }) => {
  await page.goto("/sources");
  await expect(page.getByRole("heading", { name: "來源登記冊" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /EWG Skin Deep cosmetics/ })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /CosDNA cosmetics ingredient database/ }),
  ).toBeVisible();
  await expect(page.getByText("不批量複製描述、分數、表格、圖片或產品資料庫")).toBeVisible();
  await expect(page.getByText("證據關係").first()).toBeVisible();
});
