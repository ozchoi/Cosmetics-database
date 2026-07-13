import Link from "next/link";
import { requireAdmin } from "../../lib/auth";
import { listSubmissions } from "../../lib/submission-store";
import { SectionHeader, VerificationStatusBadge } from "../../components/ui";

const adminSections = [
  ["pending-submissions", "待審核提交"],
  ["ocr-review", "OCR 審核"],
  ["unresolved-tokens", "未解析成分"],
  ["ingredients", "成分 CRUD"],
  ["ingredient-names", "名稱及別名"],
  ["substance-mappings", "物質映射"],
  ["products", "產品"],
  ["product-versions", "產品版本"],
  ["brands", "品牌"],
  ["sources", "來源"],
  ["evidence-claims", "證據聲明"],
  ["regulatory-rules", "法規規則"],
  ["methodologies", "評估方法版本"],
  ["corrections", "修正請求"],
  ["audit-log", "審計紀錄"],
] as const;

export default async function AdminDashboardPage() {
  const [session, submissions] = await Promise.all([requireAdmin(), listSubmissions()]);
  const pendingCount = submissions.filter(
    (submission) => submission.status === "pending_review",
  ).length;

  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="管理"
        title="審核工作台"
        body={`已登入：${session.email}。所有提交需人工審核，不會自動公開 OCR 結果。`}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <p className="text-sm text-[var(--muted)]">待審核提交</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <p className="text-sm text-[var(--muted)]">資料完整度提醒</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">資料不足需明確標示</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-white p-5">
          <p className="text-sm text-[var(--muted)]">版本保護</p>
          <VerificationStatusBadge status="pending_review" />
        </div>
      </div>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {adminSections.map(([slug, label]) => (
          <Link
            key={slug}
            href={`/admin/${slug}`}
            className="rounded-lg border border-[var(--line)] bg-white p-4 font-semibold text-slate-900 hover:border-[var(--accent)]"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
