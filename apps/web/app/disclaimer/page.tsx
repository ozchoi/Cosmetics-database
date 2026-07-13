import { SectionHeader } from "../../components/ui";

export default function DisclaimerPage() {
  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="免責聲明"
        title="此評估不等同醫療診斷"
        body="平台呈現潛在關注、證據可信度、資料完整度、適用條件及來源。它不提供診斷、治療建議、懷孕安全聲明或個人化醫療判斷。"
      />
      <div className="mt-8 rounded-lg border border-[var(--line)] bg-white p-6 text-sm leading-7 text-[var(--muted)]">
        <p>
          「資料不足」代表缺少可核實資料，不代表沒有潛在關注。產品實際暴露亦可能受濃度、使用方式及個人體況影響。
        </p>
      </div>
    </div>
  );
}
