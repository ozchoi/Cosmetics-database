import Link from "next/link";
import { ArrowRight, Camera, Database, FlaskConical, Search, ShieldCheck } from "lucide-react";
import { appConfig } from "@cosmetic-lens/shared";
import { latestReviewedProductsFor, latestReviewedProducts } from "../lib/data";
import { tryListDatabaseProducts } from "../lib/db-data";
import { buttonClass, InlineLink, RegulatoryNotice, SectionHeader } from "../components/ui";

export default async function HomePage() {
  const dbProducts = await tryListDatabaseProducts();
  const products = dbProducts ? latestReviewedProductsFor(dbProducts) : latestReviewedProducts();
  return (
    <div>
      <section className="border-b border-[var(--line)] bg-white">
        <div className="container-shell grid gap-8 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-16">
          <div>
            <SectionHeader
              eyebrow="化妝品成分與風險資訊"
              title={appConfig.productName}
              body="搜尋化妝品及成分、上載產品標籤相片、核對 OCR 結果，並從健康、致敏、環境、法規及證據可信度等角度理解成分資料。"
            />
            <form action="/search" className="mt-8 flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="q">
                搜尋產品、品牌、條碼或成分
              </label>
              <input
                id="q"
                name="q"
                className="min-h-12 flex-1 rounded-md border border-[var(--line)] bg-white px-4 text-base shadow-sm"
                placeholder="甘油、Glycerin、CI 77491、條碼..."
              />
              <button className={buttonClass} type="submit">
                <Search aria-hidden="true" size={18} />
                搜尋
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className={buttonClass} href="/submit">
                <Camera aria-hidden="true" size={18} />
                上載產品相片
              </Link>
              <Link
                className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--accent-strong)]"
                href="/methodology"
              >
                查看評估方法
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>
          <div className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-5">
            <h2 className="text-lg font-semibold text-slate-950">評估不等同醫療診斷</h2>
            <p className="text-sm leading-7 text-slate-700">
              平台會分開呈現 intrinsic hazard、likely exposure、potential concern、evidence
              confidence、data completeness 及 regulatory
              status。資料不足會標示為未知，不會當作零潛在關注。
            </p>
            <RegulatoryNotice>
              不使用「安全／不安全」、「有毒／無毒」等絕對標籤；所有科學或法規說法必須連到來源記錄。
            </RegulatoryNotice>
          </div>
        </div>
      </section>

      <section className="container-shell py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--line)] bg-white p-5">
            <FlaskConical aria-hidden="true" className="text-[var(--accent)]" />
            <h2 className="mt-4 font-semibold text-slate-950">成分身份先行</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              INCI、英文、繁體中文別名、CAS、CI 編號分開保存，中文譯名不是主鍵。
            </p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-white p-5">
            <ShieldCheck aria-hidden="true" className="text-[var(--accent)]" />
            <h2 className="mt-4 font-semibold text-slate-950">多維度潛在關注</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              不提供單一總分，改以六個維度顯示證據可信度及資料完整度。
            </p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-white p-5">
            <Database aria-hidden="true" className="text-[var(--accent)]" />
            <h2 className="mt-4 font-semibold text-slate-950">來源與版本追蹤</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              同一產品可按市場、日期、條碼及配方 hash 保存不同版本，不覆寫舊配方。
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader
              eyebrow="真實資料狀態"
              title="已接入真實產品資料"
              body="產品資料只會來自已批准可重用來源、用戶同意提交的包裝觀察，或 reviewer 連結真實來源後建立的記錄。品牌網頁資料會清楚標示尚未與實物包裝逐字核實。"
            />
            <Link
              className="font-semibold text-[var(--accent-strong)] underline underline-offset-4"
              href="/products"
            >
              瀏覽產品資料庫
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {products.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-5 hover:border-[var(--accent)]"
              >
                <p className="text-sm text-[var(--muted)]">{product.brand}</p>
                <h3 className="mt-1 font-semibold text-slate-950">{product.preferredName}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {product.versions[0]?.marketCode ?? "市場未指定"} ·{" "}
                  {product.versions[0]?.verificationStatus === "brand_page"
                    ? "品牌網頁資料"
                    : "核實狀態未指定"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["資料不足", "缺少危害、暴露或來源資料時，平台不會推斷為低潛在關注。"],
            ["法規提示", "法規限制、警告語及市場訊號會獨立顯示，並需要真實來源支援。"],
            ["適用條件", "免沖洗、沖洗、眼周、噴霧、粉末、兒童用途及濃度狀態都會影響解讀。"],
          ].map(([title, body]) => (
            <article key={title} className="rounded-lg border border-[var(--line)] bg-white p-5">
              <h2 className="font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{body}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-[var(--muted)]">
          詳見 <InlineLink href="/methodology">評估方法</InlineLink>、
          <InlineLink href="/sources">來源政策</InlineLink> 及{" "}
          <InlineLink href="/disclaimer">免責聲明</InlineLink>。
        </p>
      </section>
    </div>
  );
}
