import { dataSourcePolicyRecords } from "@cosmetic-lens/shared";
import { listSources, sourceTypeLabel } from "../../lib/data";
import { EmptyDataState, SectionHeader, SourceCitation } from "../../components/ui";

export default function SourcesPage() {
  const sources = listSources();
  const categoryCounts = sources.reduce<Record<string, number>>((counts, source) => {
    const label = sourceTypeLabel(source.sourceType);
    counts[label] = (counts[label] ?? 0) + 1;
    return counts;
  }, {});
  const referenceOnlyPolicies = dataSourcePolicyRecords.filter(
    (policy) =>
      policy.sourceAccessClass === "secondary_or_discovery_source" ||
      policy.accessMethod === "prohibited" ||
      !policy.importerEnabled,
  );

  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="來源政策"
        title="來源登記冊"
        body="每個公開科學或配方聲明都要能追到來源、版本、定位及證據關係。引用第三方網站只可作發現或交叉核對，不代表合作、認證或授權匯入。"
      />

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">公開欄位</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            公開來源卡必須顯示出版者、標題、來源類別、司法管轄區、發布日期、版本、取用日期、準確定位、外部連結、證據關係、證據等級，以及授權或重用狀態。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(categoryCounts).length > 0 ? (
              Object.entries(categoryCounts).map(([label, count]) => (
                <span
                  key={label}
                  className="rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-sm text-slate-700"
                >
                  {label} · {count}
                </span>
              ))
            ) : (
              <span className="rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-sm text-slate-700">
                尚未公開任何來源引用
              </span>
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-[var(--line)] bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">第三方網站處理</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            EWG Skin Deep、CosDNA
            等消費者網站只標示為次級、交叉核對或發現來源。不批量複製描述、分數、表格、圖片或產品資料庫，不使用其認證標誌，亦不暗示背書。
          </p>
        </aside>
      </section>

      <section className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">來源取用審批政策</h2>
        <p className="mt-2 text-sm leading-7 text-amber-950">
          公開網站可供瀏覽，並不代表可以大量複製、抓取或重新發布其資料。
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {referenceOnlyPolicies.map((policy) => (
            <article key={policy.id} className="rounded-md border border-amber-200 bg-white p-4">
              <h3 className="font-semibold text-slate-950">{policy.sourceName}</h3>
              <dl className="mt-3 grid gap-2 text-sm text-slate-700">
                <div>
                  <dt className="font-semibold">來源分類</dt>
                  <dd>{policy.sourceAccessClass}</dd>
                </div>
                <div>
                  <dt className="font-semibold">存取方式</dt>
                  <dd>{policy.accessMethod}</dd>
                </div>
                <div>
                  <dt className="font-semibold">法律審核</dt>
                  <dd>{policy.legalReviewStatus}</dd>
                </div>
                <div>
                  <dt className="font-semibold">自動匯入</dt>
                  <dd>{policy.importerEnabled ? "已啟用" : "不允許"}</dd>
                </div>
              </dl>
              {policy.reviewNotes ? (
                <p className="mt-3 text-sm leading-7 text-slate-700">{policy.reviewNotes}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sources.length > 0 ? (
          sources.map((source) => <SourceCitation key={source.id} source={source} />)
        ) : (
          <div className="md:col-span-2">
            <EmptyDataState
              title="未有公開來源引用"
              body="只有已連結真實來源、版本及定位的科學或配方聲明才會在此公開。"
            />
          </div>
        )}
      </div>
    </div>
  );
}
