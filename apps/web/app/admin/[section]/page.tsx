import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../lib/auth";
import { listSubmissions, reviewSubmission } from "../../../lib/submission-store";
import {
  EmptyDataState,
  IngredientName,
  SectionHeader,
  secondaryButtonClass,
  buttonClass,
} from "../../../components/ui";
import {
  dataSourcePolicyRecords,
  productionIngredientRecords,
  productionProductRecords,
  productionSourceRecords,
} from "@cosmetic-lens/shared";
import { matchIngredientList } from "@cosmetic-lens/ingredient-parser";

const sectionLabels: Record<string, string> = {
  "pending-submissions": "待審核提交",
  "ocr-review": "OCR 審核",
  "unresolved-tokens": "未解析成分",
  ingredients: "成分 CRUD",
  "ingredient-names": "名稱及別名",
  "substance-mappings": "物質映射",
  products: "產品",
  "product-versions": "產品版本",
  brands: "品牌",
  sources: "來源",
  "evidence-claims": "證據聲明",
  "regulatory-rules": "法規規則",
  methodologies: "評估方法版本",
  corrections: "修正請求",
  "audit-log": "審計紀錄",
};

async function reviewAction(formData: FormData) {
  "use server";
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") === "approved" ? "approved" : "rejected";
  const notes = String(formData.get("notes") ?? "");
  await reviewSubmission(id, status, session.email, notes);
  revalidatePath("/admin/pending-submissions");
}

export default async function AdminSectionPage({
  params,
}: Readonly<{ params: Promise<{ section: string }> }>) {
  await requireAdmin();
  const { section } = await params;
  const label = sectionLabels[section];
  if (!label) notFound();

  if (section === "pending-submissions") return <PendingSubmissions label={label} />;
  if (section === "ocr-review") return <OcrReview label={label} />;
  if (section === "unresolved-tokens") return <UnresolvedTokens label={label} />;
  if (section === "ingredients") return <IngredientsAdmin label={label} />;
  if (section === "products" || section === "product-versions" || section === "brands")
    return <ProductsAdmin label={label} />;
  if (section === "sources") return <SourcesAdmin label={label} />;
  if (section === "audit-log") return <AuditLog label={label} />;

  return <GenericAdminSection label={label} />;
}

async function PendingSubmissions({ label }: Readonly<{ label: string }>) {
  const submissions = await listSubmissions();
  const pending = submissions.filter((submission) => submission.status === "pending_review");

  return (
    <AdminShell
      label={label}
      body="比較 OCR、修正文字、產品情境及解析結果。通過後仍需連到正式 ProductVersion 才可公開。"
    >
      {pending.length === 0 ? (
        <EmptyDataState title="沒有待審核提交" body="新提交會在這裏顯示；OCR 結果不會自動公開。" />
      ) : (
        <div className="grid gap-4">
          {pending.map((submission) => (
            <article
              key={submission.id}
              className="rounded-lg border border-[var(--line)] bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-950">{submission.productName}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {submission.brandName} · {submission.marketCode} · {submission.category}
                  </p>
                </div>
                <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                  待審核
                </span>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">修正文字</h3>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-slate-950 p-3 text-sm leading-7 text-slate-100">
                    {submission.correctedText}
                  </pre>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">解析結果</h3>
                  <ul className="mt-2 grid gap-2 text-sm">
                    {matchIngredientList(submission.correctedText, productionIngredientRecords).map(
                      (match) => (
                        <li
                          key={`${submission.id}-${match.token.position}`}
                          className="rounded-md bg-[var(--surface-soft)] p-2"
                        >
                          {match.token.raw} ·{" "}
                          {match.status === "confirmed" ? "已確認" : "需人工處理"}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
              {submission.formulationDiffSummary ? (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-amber-950">可能改配方覆核任務</h3>
                      <p className="mt-1 text-sm text-amber-900">
                        基準版本：{submission.formulationDiffSummary.comparedProductVersionId}
                      </p>
                    </div>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-amber-900">
                      {submission.formulationDiffSummary.hasChanges ? "有成分差異" : "未見成分差異"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <AdminDiffList
                      title="新增"
                      items={submission.formulationDiffSummary.added}
                      emptyLabel="沒有新增"
                    />
                    <AdminDiffList
                      title="移除"
                      items={submission.formulationDiffSummary.removed}
                      emptyLabel="沒有移除"
                    />
                    <AdminDiffList
                      title="排序改變"
                      items={submission.formulationDiffSummary.reordered}
                      emptyLabel="沒有排序改變"
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-amber-950">
                    審核員需建立新 ProductVersion 或標記同一配方；不可自動覆寫既有版本。
                  </p>
                </div>
              ) : null}
              <form action={reviewAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <input type="hidden" name="id" value={submission.id} />
                <input
                  name="notes"
                  className="min-h-10 rounded-md border border-[var(--line)] px-3"
                  placeholder="審核備註"
                />
                <button className={buttonClass} name="status" value="approved" type="submit">
                  批准
                </button>
                <button
                  className={secondaryButtonClass}
                  name="status"
                  value="rejected"
                  type="submit"
                >
                  拒絕
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function AdminDiffList({
  title,
  items,
  emptyLabel,
}: Readonly<{
  title: string;
  items: Array<{ raw: string; fromPosition?: number | undefined; toPosition?: number | undefined }>;
  emptyLabel: string;
}>) {
  return (
    <div className="rounded-md bg-white p-3 text-sm">
      <h4 className="font-semibold text-amber-950">{title}</h4>
      {items.length > 0 ? (
        <ul className="mt-2 grid gap-1 text-amber-900">
          {items.map((item) => (
            <li key={`${item.raw}-${item.fromPosition ?? "new"}-${item.toPosition ?? "old"}`}>
              {item.raw}
              <span className="ml-2 text-xs">
                {item.fromPosition ? `原 #${item.fromPosition}` : ""}
                {item.fromPosition && item.toPosition ? " → " : ""}
                {item.toPosition ? `新 #${item.toPosition}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-amber-900">{emptyLabel}</p>
      )}
    </div>
  );
}

async function OcrReview({ label }: Readonly<{ label: string }>) {
  const submissions = await listSubmissions();
  return (
    <AdminShell
      label={label}
      body="檢視原始 OCR、修正文字及信心度。正式版本應連回 ProductImage、OcrJob 及 OcrSegment。"
    >
      <div className="grid gap-4">
        {submissions.map((submission) => (
          <article
            key={submission.id}
            className="rounded-lg border border-[var(--line)] bg-white p-4"
          >
            <h2 className="font-semibold text-slate-950">{submission.productName}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">原始 OCR</p>
            <pre className="mt-2 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-6 text-slate-100">
              {submission.rawOcrText ?? "未保存"}
            </pre>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}

async function UnresolvedTokens({ label }: Readonly<{ label: string }>) {
  const submissions = await listSubmissions();
  const unresolved = submissions.flatMap((submission) =>
    matchIngredientList(submission.correctedText, productionIngredientRecords)
      .filter((match) => match.status !== "confirmed")
      .map((match) => ({ submission, match })),
  );

  return (
    <AdminShell
      label={label}
      body="未知或低信心成分需人工解決，可建立別名，但不能直接建立未審核 canonical ingredient。"
    >
      {unresolved.length === 0 ? (
        <EmptyDataState title="沒有未解析成分" body="不確定配對會在這裏排隊。" />
      ) : (
        <div className="grid gap-3">
          {unresolved.map(({ submission, match }) => (
            <article
              key={`${submission.id}-${match.token.position}`}
              className="rounded-lg border border-amber-300 bg-amber-50 p-4"
            >
              <h2 className="font-semibold text-amber-950">{match.token.raw}</h2>
              <p className="mt-1 text-sm text-amber-900">來源提交：{submission.productName}</p>
              <p className="mt-2 text-sm text-amber-900">
                候選：
                {match.candidates
                  .map((candidate) => candidate.ingredient.preferredZhHantHkName)
                  .join("、") || "沒有候選"}
              </p>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function IngredientsAdmin({ label }: Readonly<{ label: string }>) {
  return (
    <AdminShell
      label={label}
      body="管理成分身份、INCI、中文名稱、英文名稱、別名及功能；中文名稱不得作 primary identity。"
    >
      <div className="grid gap-3 md:grid-cols-2">
        {productionIngredientRecords.map((ingredient) => (
          <article
            key={ingredient.id}
            className="rounded-lg border border-[var(--line)] bg-white p-4"
          >
            <IngredientName ingredient={ingredient} compact />
          </article>
        ))}
      </div>
    </AdminShell>
  );
}

function ProductsAdmin({ label }: Readonly<{ label: string }>) {
  return (
    <AdminShell
      label={label}
      body="產品及版本以 formula hash、market、barcode、觀察日期及審核狀態區分；舊版本不可覆寫。"
    >
      <div className="grid gap-3">
        {productionProductRecords.map((product) => (
          <article key={product.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
            <h2 className="font-semibold text-slate-950">{product.preferredName}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {product.brand} · {product.versions.length} 個版本
            </p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}

function SourcesAdmin({ label }: Readonly<{ label: string }>) {
  return (
    <AdminShell
      label={label}
      body="來源不可在仍被 active evidence 引用時刪除；未知授權不得批量匯入。公開網站可供瀏覽，並不代表可以大量複製、抓取或重新發布其資料。"
    >
      <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
        公開網站可供瀏覽，並不代表可以大量複製、抓取或重新發布其資料。
      </div>
      <div className="mb-6 grid gap-3">
        {dataSourcePolicyRecords.map((policy) => (
          <article key={policy.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">{policy.sourceName}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {policy.sourceAccessClass} · {policy.accessMethod} · legal{" "}
                  {policy.legalReviewStatus}
                </p>
              </div>
              <span className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-xs font-semibold text-slate-700">
                {policy.importerEnabled ? "importer enabled" : "reference/import disabled"}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">{policy.reviewNotes}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-3">
        {productionSourceRecords.map((source) => (
          <article key={source.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
            <h2 className="font-semibold text-slate-950">{source.title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {source.publisher} · licence {source.licenceStatus} · reuse{" "}
              {source.commercialReuseStatus}
            </p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}

async function AuditLog({ label }: Readonly<{ label: string }>) {
  const submissions = await listSubmissions();
  const entries = submissions.flatMap((submission) =>
    submission.auditTrail.map((entry) => ({
      ...entry,
      entity: submission.id,
      productName: submission.productName,
    })),
  );
  return (
    <AdminShell label={label} body="所有管理變更應保留 before/after JSON、actor、entity 及時間。">
      <div className="grid gap-3">
        {entries.map((entry) => (
          <article
            key={`${entry.entity}-${entry.at}-${entry.action}`}
            className="rounded-lg border border-[var(--line)] bg-white p-4"
          >
            <h2 className="font-semibold text-slate-950">{entry.action}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {entry.productName} · {entry.actor} · {entry.at}
            </p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}

function GenericAdminSection({ label }: Readonly<{ label: string }>) {
  return (
    <AdminShell
      label={label}
      body="此區已接入受保護管理導覽，正式資料寫入需使用 Prisma 交易、Zod 驗證、來源要求、衝突警示、審計紀錄及刪除確認。"
    >
      <div className="rounded-lg border border-[var(--line)] bg-white p-5 text-sm leading-7 text-[var(--muted)]">
        本 MVP 保留此管理面向的資訊架構與存取控制；下一階段可逐項接上 PostgreSQL CRUD 表單。
      </div>
    </AdminShell>
  );
}

function AdminShell({
  label,
  body,
  children,
}: Readonly<{ label: string; body: string; children: React.ReactNode }>) {
  return (
    <div className="container-shell py-10">
      <SectionHeader eyebrow="管理" title={label} body={body} />
      <div className="mt-8">{children}</div>
    </div>
  );
}
