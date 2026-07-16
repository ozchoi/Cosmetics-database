import { expect, test } from "@playwright/test";

const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

test("search shows imported real ingredient and product data", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "化妝品成分資料平台", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("化妝品成分與風險資訊")).toBeVisible();
  await expect(page.getByText("搜尋化妝品及成分、上載產品標籤相片")).toBeVisible();
  await page.getByLabel("搜尋產品、品牌、條碼或成分").fill("甘油");
  await page.getByRole("button", { name: "搜尋" }).click();
  await expect(page.getByRole("heading", { name: "成分", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /甘油/u }).first()).toBeVisible();
  await page.goto("/");
  await page.getByLabel("搜尋產品、品牌、條碼或成分").fill("CeraVe");
  await page.getByRole("button", { name: "搜尋" }).click();
  await expect(page.getByRole("heading", { name: "產品", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Foaming Cleanser/u }).first()).toBeVisible();
});

test("uploads a label, runs deterministic OCR, submits contribution, and reviews as admin", async ({
  page,
}, testInfo) => {
  const productName = `測試保濕精華 ${testInfo.project.name} ${Date.now()}`;
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
  await expect(page.getByText("未解析").first()).toBeVisible();

  await page.getByLabel("產品名稱").fill(productName);
  await page.getByLabel("品牌").fill("測試品牌");
  await page.getByLabel("提交成分文字，但不保存原圖").check();
  await page.getByLabel(/我確認相片由我拍攝/).check();
  const submitButton = page.getByRole("button", { name: "提交待審核" });
  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ force: true });
  await expect(page.getByText("已建立待審核提交")).toBeVisible({ timeout: 15_000 });

  await page.goto("/admin/login");
  await page.getByLabel("電郵").fill("admin@example.test");
  await page.getByLabel("密碼").fill("change-me-in-dev");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page.getByRole("heading", { name: "審核工作台" })).toBeVisible();

  await page.goto("/admin/pending-submissions");
  const submissionCard = page.locator("article").filter({ hasText: productName }).first();
  await expect(submissionCard).toBeVisible();
  await expect(submissionCard.getByText(/已確認|需人工處理/u).first()).toBeVisible();
  await submissionCard.getByPlaceholder("審核備註").fill("E2E approval");
  const approveButton = submissionCard.getByRole("button", { name: "批准" });
  await approveButton.scrollIntoViewIfNeeded();
  await approveButton.click({ force: true });
  await expect(page.getByRole("heading", { name: "待審核提交" })).toBeVisible();
});

test("browses products by freshness without an overall safe-products filter", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "瀏覽產品" })).toBeVisible();
  await expect(page.getByText("沒有「安全產品」篩選")).toBeVisible();
  await expect(page.getByText("4 個公開產品版本")).toBeVisible();
  await expect(page.getByRole("link", { name: /Foaming Cleanser/u }).first()).toBeVisible();
});

test("shows source registry metadata and third-party website handling", async ({ page }) => {
  await page.goto("/sources");
  await expect(page.getByRole("heading", { name: "來源登記冊" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "EWG Skin Deep" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "CosDNA" }).first()).toBeVisible();
  await expect(page.getByText("不批量複製描述、分數、表格、圖片或產品資料庫")).toBeVisible();
  await expect(page.getByText("公開網站可供瀏覽，並不代表可以大量複製")).toBeVisible();
  await expect(page.getByText("Environmental Working Group").first()).toBeVisible();
});
