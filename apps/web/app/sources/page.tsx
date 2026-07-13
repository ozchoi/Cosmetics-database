import { listSources } from "../../lib/data";
import { SectionHeader, SourceCitation } from "../../components/ui";

export default function SourcesPage() {
  const sources = listSources();
  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="來源政策"
        title="來源登記冊"
        body="引用來源不代表可以複製整個資料庫。每個來源需要追蹤授權、商業重用狀態、定位、取用日期及證據等級。"
      />
      <div className="mt-8 rounded-lg border border-[var(--line)] bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">來源類別</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          官方法規、官方安全意見、原始研究、系統性回顧、專業資料庫、品牌文件、包裝標籤、消費者網站及社群提交需分開標示。
          消費者網站可作發現或交叉核對來源，但不得直接複製其評分並當作平台分數。
        </p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <SourceCitation key={source.id} source={source} />
        ))}
      </div>
    </div>
  );
}
