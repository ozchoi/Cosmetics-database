import Link from "next/link";
import { ArrowUpDown, Filter } from "lucide-react";
import {
  browseProducts,
  productBrowseOptions,
  type DataFreshnessStatus,
  type ProductBrowseFilters,
} from "../../lib/data";
import {
  DataCompletenessIndicator,
  DataFreshnessBadge,
  EmptyDataState,
  EvidenceGradeBadge,
  SectionHeader,
  VerificationStatusBadge,
  buttonClass,
  secondaryButtonClass,
} from "../../components/ui";
import type { ConcernDimension } from "@cosmetic-lens/shared";

const field = (params: Record<string, string | string[] | undefined>, key: string): string | undefined => {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value || undefined;
};

export default async function ProductsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>) {
  const params = await searchParams;
  const filters: ProductBrowseFilters = {
    category: field(params, "category"),
    brand: field(params, "brand"),
    usageType: field(params, "usageType"),
    productForm: field(params, "productForm"),
    bodyArea: field(params, "bodyArea"),
    market: field(params, "market"),
    verificationStatus: field(params, "verificationStatus"),
    freshness: field(params, "freshness") as DataFreshnessStatus | undefined,
    evidenceConfidence: field(params, "evidenceConfidence"),
    minCompleteness: field(params, "minCompleteness") ? Number(field(params, "minCompleteness")) : undefined,
    concernDimension: field(params, "concernDimension") as ConcernDimension | undefined,
    sort: field(params, "sort"),
  };
  const options = productBrowseOptions();
  const products = browseProducts(filters);

  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="產品資料庫"
        title="瀏覽產品"
        body="按產品類別、品牌、用途、形態、部位、市場、核實狀態、配方新鮮度、證據可信度、資料完整度及個別關注維度篩選。沒有「安全產品」篩選。"
      />

      <form className="mt-8 rounded-lg border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-2">
          <Filter aria-hidden="true" size={18} className="text-[var(--accent)]" />
          <h2 className="font-semibold text-slate-950">篩選</h2>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Select name="category" label="產品類別" value={filters.category} options={options.categories} />
          <Select name="brand" label="品牌" value={filters.brand} options={options.brands} />
          <Select name="usageType" label="免沖洗／沖洗" value={filters.usageType} options={options.usageTypes} />
          <Select name="productForm" label="產品形態" value={filters.productForm} options={options.productForms} />
          <Select name="bodyArea" label="使用部位" value={filters.bodyArea} options={options.bodyAreas} />
          <Select name="market" label="市場" value={filters.market} options={options.markets} />
          <Select
            name="verificationStatus"
            label="核實狀態"
            value={filters.verificationStatus}
            options={options.verificationStatuses}
          />
          <Select
            name="freshness"
            label="配方新鮮度"
            value={filters.freshness}
            options={["最新已核實", "最近核實", "可能已更新", "舊配方", "核實日期不明"]}
          />
          <Select
            name="evidenceConfidence"
            label="證據可信度"
            value={filters.evidenceConfidence}
            options={options.evidenceGrades}
          />
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-800">最低資料完整度</span>
            <select
              name="minCompleteness"
              defaultValue={filters.minCompleteness?.toString() ?? ""}
              className="min-h-10 rounded-md border border-[var(--line)] bg-white px-3"
            >
              <option value="">不限</option>
              <option value="0.25">25% 以上</option>
              <option value="0.5">50% 以上</option>
              <option value="0.75">75% 以上</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-800">關注維度</span>
            <select
              name="concernDimension"
              defaultValue={filters.concernDimension ?? ""}
              className="min-h-10 rounded-md border border-[var(--line)] bg-white px-3"
            >
              <option value="">未選擇</option>
              {options.dimensions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-slate-800">排序</span>
            <select
              name="sort"
              defaultValue={filters.sort ?? "recently_verified"}
              className="min-h-10 rounded-md border border-[var(--line)] bg-white px-3"
            >
              <option value="recently_verified">最近核實</option>
              <option value="most_complete">資料最完整</option>
              <option value="alphabetical">字母／筆劃排序</option>
              <option value="recently_submitted">最近提交</option>
              <option value="dimension_low">所選維度數值由低至高</option>
              <option value="dimension_high">所選維度數值由高至低</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className={buttonClass} type="submit">
            <Filter aria-hidden="true" size={17} />
            套用
          </button>
          <Link className={secondaryButtonClass} href="/products">
            清除
          </Link>
        </div>
      </form>

      {filters.sort?.startsWith("dimension") && filters.concernDimension ? (
        <p className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-7 text-sky-950">
          <ArrowUpDown aria-hidden="true" className="mr-2 inline" size={16} />
          此排序只根據所選維度及現有資料，不代表整體產品安全或醫療判斷。
        </p>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-950">結果</h2>
          <p className="text-sm text-[var(--muted)]">{products.length} 個公開產品版本</p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {products.length > 0 ? (
            products.map(({ product, version, freshness, freshnessReason, isPossiblyStale }) => (
              <Link
                key={`${product.id}-${version.id}`}
                href={`/products/${product.slug}?version=${version.id}`}
                className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm hover:border-[var(--accent)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--muted)]">{product.brand}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">{product.preferredName}</h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {version.versionLabel} · {version.category} · {version.marketCode}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                    <VerificationStatusBadge status={version.verificationStatus} />
                    <DataFreshnessBadge status={freshness} />
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <DataCompletenessIndicator value={version.dataCompleteness} />
                  <div>
                    <p className="mb-1 text-xs text-[var(--muted)]">證據可信度</p>
                    <EvidenceGradeBadge grade={version.evidenceConfidence} />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{freshnessReason}</p>
                {isPossiblyStale ? (
                  <p className="mt-2 text-sm font-semibold text-amber-900">
                    此配方資料可能已過時。購買或使用前，請對照實物包裝上的成分表。
                  </p>
                ) : null}
              </Link>
            ))
          ) : (
            <div className="lg:col-span-2">
              <EmptyDataState title="沒有相符產品" body="請放寬篩選條件；未公開或待審核版本不會在此列表顯示。" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Select({
  name,
  label,
  value,
  options,
}: Readonly<{ name: string; label: string; value?: string; options: string[] }>) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-slate-800">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        className="min-h-10 rounded-md border border-[var(--line)] bg-white px-3"
      >
        <option value="">不限</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
