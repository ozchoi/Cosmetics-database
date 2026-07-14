import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allDimensionLabels,
  getIngredient,
  getProduct,
  getSource,
  productFormDisplay,
  productRatingsForDisplay,
  productVersionFreshness,
  usageTypeDisplay,
} from "../../../lib/data";
import {
  ConcernRangeCard,
  DataCompletenessIndicator,
  DataFreshnessBadge,
  EvidenceGradeBadge,
  IngredientName,
  RegulatoryNotice,
  SectionHeader,
  SourceCitation,
  VerificationStatusBadge,
} from "../../../components/ui";

export default async function ProductPage({
  params,
  searchParams,
}: Readonly<{ params: Promise<{ slug: string }>; searchParams: Promise<{ version?: string }> }>) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const product = getProduct(slug);
  if (!product) notFound();

  const selectedVersion =
    product.versions.find((version) => version.id === query.version) ??
    product.versions.find((version) => version.publicationStatus === "published") ??
    product.versions[0]!;
  const freshness = productVersionFreshness(selectedVersion);
  const ratings = productRatingsForDisplay();
  const sources = selectedVersion.sourceIds
    .map(getSource)
    .filter((source): source is NonNullable<typeof source> => Boolean(source));

  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow={product.brand}
        title={product.preferredName}
        body={product.descriptionZhHant}
      />

      <section className="mt-8 rounded-lg border border-[var(--line)] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">配方版本</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              同一產品可因市場、日期、條碼或包裝版本而有不同成分表。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <VerificationStatusBadge status={selectedVersion.verificationStatus} />
            <DataFreshnessBadge status={freshness.status} />
          </div>
        </div>
        <form className="mt-5">
          <label htmlFor="version" className="text-sm font-semibold text-slate-800">
            選擇版本
          </label>
          <select
            id="version"
            name="version"
            defaultValue={selectedVersion.id}
            className="mt-2 min-h-11 w-full rounded-md border border-[var(--line)] bg-white px-3 md:max-w-md"
            aria-describedby="version-help"
          >
            {product.versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.versionLabel} ·{" "}
                {version.verificationStatus === "reviewed" ? "已審核" : "待審核"}
              </option>
            ))}
          </select>
          <button
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-[var(--surface-soft)]"
            type="submit"
          >
            切換版本
          </button>
          <p id="version-help" className="mt-2 text-xs text-[var(--muted)]">
            如需切換版本，可在網址加上 <code>?version=版本ID</code>；管理介面可比較配方差異。
          </p>
        </form>

        {freshness.isPossiblyStale ? (
          <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
            此配方資料可能已過時。購買或使用前，請對照實物包裝上的成分表。
          </div>
        ) : null}

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-semibold text-slate-800">市場</dt>
            <dd className="mt-1 text-[var(--muted)]">{selectedVersion.marketCode}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">條碼</dt>
            <dd className="mt-1 text-[var(--muted)]">{selectedVersion.barcode ?? "未提供"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">類別</dt>
            <dd className="mt-1 text-[var(--muted)]">{selectedVersion.category}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">形態／使用方式</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {productFormDisplay(selectedVersion.productForm)} ·{" "}
              {usageTypeDisplay(selectedVersion.usageType)}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">使用部位</dt>
            <dd className="mt-1 text-[var(--muted)]">{selectedVersion.bodyArea.join("、")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">觀察日期</dt>
            <dd className="mt-1 text-[var(--muted)]">{selectedVersion.labelObservedAt}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">獨立核實日期</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {selectedVersion.lastIndependentVerificationAt ?? "未提供"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">品牌確認日期</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {selectedVersion.brandConfirmedAt ?? "未提供"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">較新衝突提交</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {selectedVersion.conflictingNewerSubmissionCount ?? 0} 宗
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">市場配方證據</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {selectedVersion.marketSpecificEvidenceCount ?? 0} 項
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-slate-800">配方 Hash</dt>
            <dd className="mt-1 break-all text-[var(--muted)]">{selectedVersion.formulaHash}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">資料新鮮度</dt>
            <dd className="mt-1 text-[var(--muted)]">{freshness.reason}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">證據可信度</dt>
            <dd className="mt-1">
              <EvidenceGradeBadge grade={selectedVersion.evidenceConfidence} />
            </dd>
          </div>
        </dl>
        <div className="mt-6 max-w-md">
          <DataCompletenessIndicator value={selectedVersion.dataCompleteness} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-950">完整有序成分表</h2>
        <ol className="mt-4 grid gap-3">
          {selectedVersion.ingredients.map((productIngredient) => {
            const ingredient = productIngredient.ingredientSlug
              ? getIngredient(productIngredient.ingredientSlug)
              : undefined;
            return (
              <li
                key={`${selectedVersion.id}-${productIngredient.position}`}
                className="rounded-lg border border-[var(--line)] bg-white p-4"
              >
                <div className="grid gap-3 md:grid-cols-[48px_1fr_auto] md:items-center">
                  <span className="text-sm font-semibold text-[var(--muted)]">
                    #{productIngredient.position}
                  </span>
                  {ingredient ? (
                    <IngredientName ingredient={ingredient} compact />
                  ) : (
                    <div>
                      <p className="font-semibold text-slate-950">
                        {productIngredient.rawLabelToken}
                      </p>
                      <p className="text-sm text-[var(--muted)]">未解析標籤文字</p>
                    </div>
                  )}
                  <span className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-xs text-slate-700">
                    {productIngredient.matchStatus === "confirmed" ? "已確認" : "需人工覆核"} ·{" "}
                    {Math.round(productIngredient.matchConfidence * 100)}%
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-950">多維度潛在關注</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
          MVP 不顯示單一總分。現有開發種子未加入真實毒理或法規資料，因此多數維度會顯示資料不足。
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ratings.map((rating) => {
            const range =
              rating.scoreMin !== undefined && rating.scoreMax !== undefined
                ? `${rating.scoreMin.toFixed(2)}–${rating.scoreMax.toFixed(2)}`
                : undefined;
            return (
              <ConcernRangeCard
                key={rating.dimension}
                title={rating.labelZhHant}
                status={rating.concernBand}
                confidence={rating.confidenceGrade}
                completeness={rating.dataCompleteness}
                explanation={rating.explanationZhHant}
                {...(range ? { range } : {})}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-4">
        <RegulatoryNotice>
          未能單憑成分表確認實際濃度。成分排序不等同精確濃度，低濃度成分亦可能不嚴格排序。
        </RegulatoryNotice>
        <RegulatoryNotice>
          {allDimensionLabels.map(([, label]) => label).join("、")}{" "}
          會分開顯示；法規提示不會被合併成整體安全分數。
        </RegulatoryNotice>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-950">來源標籤及配方歷史</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4">
            {sources.length > 0 ? (
              sources.map((source) => <SourceCitation key={source.id} source={source} />)
            ) : (
              <p className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
                未有公開來源。
              </p>
            )}
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-white p-5">
            <h3 className="font-semibold text-slate-950">版本紀錄</h3>
            <ul className="mt-4 grid gap-3 text-sm">
              {product.versions.map((version) => {
                const versionFreshness = productVersionFreshness(version);
                return (
                  <li key={version.id} className="rounded-md bg-[var(--surface-soft)] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link
                        href={`/products/${product.slug}?version=${version.id}`}
                        className="font-semibold text-[var(--accent-strong)]"
                      >
                        {version.versionLabel}
                      </Link>
                      <DataFreshnessBadge status={versionFreshness.status} />
                    </div>
                    <p className="mt-1 text-[var(--muted)]">
                      {version.labelObservedAt} · {version.marketCode} ·{" "}
                      {version.formulaHash.slice(0, 22)}...
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{versionFreshness.reason}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
