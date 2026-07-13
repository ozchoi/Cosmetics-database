import { allDimensionLabels } from "../../lib/data";
import { ConcernRangeCard, RegulatoryNotice, SectionHeader } from "../../components/ui";

export default function MethodologyPage() {
  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="方法透明度"
        title="暫定評估方法 mvp-0.1"
        body="平台分開記錄危害、暴露、產品情境、證據可信度、資料完整度及法規狀態。方法仍屬 MVP，需經專家審核及版本管理。"
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <ConcernRangeCard
          title="危害與暴露分開"
          status="不等同風險預測"
          confidence="U"
          completeness={0}
          explanation="intrinsic hazard 只描述成分或物質的潛在性質；likely exposure 需要產品類型、使用方式、部位、濃度及頻率等資料。"
        />
        <ConcernRangeCard
          title="未知濃度"
          status="不以排序推斷精確濃度"
          confidence="U"
          completeness={0}
          explanation="成分排序可作有限參考，但不能直接推算實際濃度；低濃度成分亦可能不嚴格排序。"
        />
        <ConcernRangeCard
          title="資料不足"
          status="未知，不是零潛在關注"
          confidence="U"
          completeness={0}
          explanation="缺少資料時，系統不會用零分填補；頁面會顯示資料不足、適用條件及所需來源。"
        />
        <ConcernRangeCard
          title="證據等級"
          status="A 至 U"
          confidence="U"
          completeness={0.2}
          explanation="A 代表官方法規或高度相關權威證據；U 代表資料不足。低可信度不代表低潛在關注。"
        />
      </div>

      <section className="mt-10 rounded-lg border border-[var(--line)] bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">六個 MVP 維度</h2>
        <ul className="mt-4 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
          {allDimensionLabels.map(([dimension, label]) => (
            <li key={dimension} className="rounded-md bg-[var(--surface-soft)] px-3 py-2">
              {label}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 grid gap-4">
        <RegulatoryNotice>
          暫定計算框架為：成分潛在關注 = hazard severity × exposure range × product-context
          modifiers；端點聚合使用最大貢獻 70% 及前三大平均 30%，所有係數須可配置。
        </RegulatoryNotice>
        <RegulatoryNotice>
          法規警告、禁用、濃度限制及市場訊號會獨立呈現，不會混入單一總分。此評估不等同醫療診斷。
        </RegulatoryNotice>
      </section>

      <section className="mt-8 rounded-lg border border-[var(--line)] bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">版本歷史</h2>
        <dl className="mt-4 text-sm text-[var(--muted)]">
          <dt className="font-semibold text-slate-800">mvp-0.1</dt>
          <dd className="mt-1 leading-7">
            開發版方法，支援範圍、資料不足狀態、證據可信度、資料完整度及成分級貢獻。未經專家審核前不得作正式科學結論。
          </dd>
        </dl>
      </section>
    </div>
  );
}
