import { notFound } from "next/navigation";
import {
  allDimensionLabels,
  getIngredient,
  getIngredientDemoEvidence,
  getSource,
} from "../../../lib/data";
import {
  ConcernRangeCard,
  EvidenceGradeBadge,
  IngredientName,
  RegulatoryNotice,
  SectionHeader,
  SourceCitation,
} from "../../../components/ui";

export default async function IngredientPage({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const ingredient = getIngredient(slug);
  if (!ingredient) notFound();

  const evidence = getIngredientDemoEvidence(ingredient.slug);
  const sources = evidence
    .flatMap((item) => item.sourceIds.map(getSource))
    .filter((source): source is NonNullable<typeof source> => Boolean(source));

  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="成分資料"
        title={ingredient.preferredZhHantHkName}
        body="成分身份、別名、功能、關注維度及來源需要分開記錄。此頁示範資料不包含未經來源支援的安全結論。"
      />

      <section className="mt-8 rounded-lg border border-[var(--line)] bg-white p-6">
        <IngredientName ingredient={ingredient} />
        <dl className="mt-6 grid gap-4 text-sm md:grid-cols-3">
          <div>
            <dt className="font-semibold text-slate-800">成分類型</dt>
            <dd className="mt-1 text-[var(--muted)]">{ingredient.ingredientType}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">化妝品功能</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {ingredient.functions.join("、") || "資料不足"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">最後審核日期</dt>
            <dd className="mt-1 text-[var(--muted)]">{ingredient.lastReviewedAt ?? "資料不足"}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">名稱及識別資料</h2>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">其他名稱</h3>
          <ul className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
            {ingredient.aliases.map((alias) => (
              <li
                key={`${alias.name}-${alias.languageCode}-${alias.regionCode ?? "global"}`}
                className="rounded-md bg-[var(--surface-soft)] px-3 py-2"
              >
                {alias.name} · {alias.languageCode}
                {alias.regionCode ? `-${alias.regionCode}` : ""} · {alias.nameType}
              </li>
            ))}
          </ul>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">化學識別碼</h3>
          <ul className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
            {ingredient.identifiers.length > 0 ? (
              ingredient.identifiers.map((identifier) => (
                <li
                  key={`${identifier.kind}-${identifier.value}`}
                  className="rounded-md bg-[var(--surface-soft)] px-3 py-2"
                >
                  {identifier.kind}：{identifier.value}
                </li>
              ))
            ) : (
              <li>資料不足</li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-950">多維度證據摘要</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {allDimensionLabels.map(([dimension, label]) => {
              const item = evidence.find((entry) => entry.dimension === dimension);
              return (
                <ConcernRangeCard
                  key={dimension}
                  title={label}
                  status="資料不足"
                  confidence={item?.evidenceGrade ?? "U"}
                  completeness={item?.dataCompleteness ?? 0}
                  explanation={
                    item?.summaryZhHant ?? "未有足夠已審核來源資料；資料不足不等同零潛在關注。"
                  }
                />
              );
            })}
          </div>
        </section>
      </div>

      <section className="mt-8 grid gap-4">
        <RegulatoryNotice>
          法規狀態會按司法管轄區、用途、產品範圍、濃度及生效日期獨立記錄。此開發種子未加入真實法規限制。
        </RegulatoryNotice>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-950">來源參考</h2>
          <EvidenceGradeBadge grade="U" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {sources.length > 0 ? (
            sources.map((source) => <SourceCitation key={source.id} source={source} />)
          ) : (
            <p className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
              尚未有可公開顯示的來源記錄。任何科學或法規聲明都必須先連到來源。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
