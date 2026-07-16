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
  const regulatoryRules = ingredient.regulatoryRules ?? [];
  const sources = evidence
    .flatMap((item) => item.sourceIds.map(getSource))
    .concat(regulatoryRules.map((rule) => getSource(rule.sourceId)))
    .filter((source): source is NonNullable<typeof source> => Boolean(source));
  const humanEvidence = evidence.filter((item) => item.dimension !== "environment");
  const environmentalEvidence = evidence.filter((item) => item.dimension === "environment");

  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="成分資料"
        title={ingredient.preferredZhHantHkName}
        body="成分身份、別名、功能、適用條件、證據可信度及來源需要分開記錄。資料不足不會被解讀為零潛在關注。"
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
        {regulatoryRules.length > 0 ? (
          regulatoryRules.map((rule) => (
            <RegulatoryNotice key={rule.id}>
              {rule.jurisdiction} · {rule.status}：{rule.summaryZhHant}
            </RegulatoryNotice>
          ))
        ) : (
          <RegulatoryNotice>
            暫未有已核實法規限制資料。法規狀態需按司法管轄區、用途、產品範圍、濃度及生效日期獨立記錄。
          </RegulatoryNotice>
        )}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <EvidenceList title="人體健康" items={humanEvidence} />
        <EvidenceList
          title="環境健康"
          items={environmentalEvidence}
          emptyText="暫未有足夠已核實的環境資料。這不代表成分對環境沒有影響。"
        />
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

function EvidenceList({
  title,
  items,
  emptyText = "暫未有足夠已核實資料。這不代表沒有潛在關注。",
}: Readonly<{
  title: string;
  items: ReturnType<typeof getIngredientDemoEvidence>;
  emptyText?: string;
}>) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-white p-6">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-4 grid gap-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-md bg-[var(--surface-soft)] p-4 text-sm leading-7">
              <p className="font-semibold text-slate-950">{item.contextLabelZh ?? item.endpoint}</p>
              <p className="mt-1 text-[var(--muted)]">{item.summaryZhHant}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                濃度：{item.concentration ?? "資料不足"} · 暴露途徑：{item.route ?? "未指定"} ·
                證據可信度：{item.evidenceGrade}
              </p>
              {item.limitationsZhHant ? (
                <p className="mt-2 text-xs text-[var(--muted)]">限制：{item.limitationsZhHant}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-md bg-[var(--surface-soft)] p-4 text-sm leading-7 text-[var(--muted)]">
          {emptyText}
        </p>
      )}
    </section>
  );
}
