import { expect, test } from "@playwright/test";

const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

test("search shows no preloaded fictional ingredient or product data", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("搜尋產品、品牌、條碼或成分").fill("甘油");
  await page.getByRole("button", { name: "搜尋" }).click();
  await expect(page.getByRole("heading", { name: "成分", exact: true })).toBeVisible();
  await expect(page.getByText("沒有成分結果")).toBeVisible();
  await expect(page.getByText("沒有產品結果")).toBeVisible();
});

test("uploads a label, runs deterministic OCR, submits contribution, and reviews as admin", async ({
  page,
}, testInfo) => {
  const productName = `測試保濕精華 ${testInfo.project.name}`;
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
  await expect(page.getByText("已建立待審核提交")).toBeVisible();

  await page.goto("/admin/login");
  await page.getByLabel("電郵").fill("admin@example.test");
  await page.getByLabel("密碼").fill("change-me-in-dev");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page.getByRole("heading", { name: "審核工作台" })).toBeVisible();

  await page.goto("/admin/pending-submissions");
  const submissionCard = page.locator("article").filter({ hasText: productName }).first();
  await expect(submissionCard).toBeVisible();
  await expect(submissionCard.getByText("需人工處理").first()).toBeVisible();
  await submissionCard.getByPlaceholder("審核備註").fill("E2E approval");
  await submissionCard.getByRole("button", { name: "批准" }).click();
  await expect(submissionCard).not.toBeVisible();
});

test("browses products by freshness without an overall safe-products filter", async ({ page }) => {
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "瀏覽產品" })).toBeVisible();
  await expect(page.getByText("沒有「安全產品」篩選")).toBeVisible();
  await expect(page.getByText("0 個公開產品版本")).toBeVisible();
  await expect(page.getByText("沒有相符產品")).toBeVisible();
});

test("shows source registry metadata and third-party website handling", async ({ page }) => {
  await page.goto("/sources");
  await expect(page.getByRole("heading", { name: "來源登記冊" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "EWG Skin Deep" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "CosDNA" })).toBeVisible();
  await expect(page.getByText("不批量複製描述、分數、表格、圖片或產品資料庫")).toBeVisible();
  await expect(page.getByText("公開網站可供瀏覽，並不代表可以大量複製")).toBeVisible();
  await expect(page.getByText("未有公開來源引用")).toBeVisible();
});
