import Link from "next/link";
import { AlertCircle, CheckCircle2, HelpCircle, SearchX } from "lucide-react";
import clsx from "clsx";
import type {
  EvidenceGrade,
  IngredientRecord,
  SourceRecord,
  VerificationStatus,
} from "@cosmetic-lens/shared";
import { evidenceGradeDescriptions } from "@cosmetic-lens/shared";

export const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-transparent bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-60";

export function SectionHeader({
  eyebrow,
  title,
  body,
}: Readonly<{ eyebrow?: string; title: string; body?: string }>) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold text-[var(--accent)]">{eyebrow}</p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-normal text-slate-950 md:text-5xl">{title}</h1>
      {body ? (
        <p className="mt-4 text-base leading-8 text-[var(--muted)] md:text-lg">{body}</p>
      ) : null}
    </div>
  );
}

export function IngredientName({
  ingredient,
  compact = false,
}: Readonly<{ ingredient: IngredientRecord; compact?: boolean }>) {
  return (
    <span className="grid gap-0.5">
      <span className={clsx("font-semibold text-slate-950", compact ? "text-base" : "text-xl")}>
        {ingredient.preferredZhHantHkName}
      </span>
      <span className={clsx("text-[var(--muted)]", compact ? "text-xs" : "text-sm")}>
        {ingredient.preferredEnglishName}
      </span>
      <span className="text-xs tracking-normal text-slate-500">
        INCI：{ingredient.canonicalInciName}
      </span>
    </span>
  );
}

export function EvidenceGradeBadge({ grade }: Readonly<{ grade: EvidenceGrade }>) {
  const styles: Record<EvidenceGrade, string> = {
    A: "border-emerald-700/30 bg-emerald-50 text-emerald-900",
    B: "border-teal-700/30 bg-teal-50 text-teal-900",
    C: "border-sky-700/30 bg-sky-50 text-sky-900",
    D: "border-amber-700/30 bg-amber-50 text-amber-900",
    U: "border-slate-400/40 bg-slate-50 text-slate-700",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
        styles[grade],
      )}
      title={evidenceGradeDescriptions[grade]}
    >
      證據 {grade}
    </span>
  );
}

export function DataCompletenessIndicator({ value }: Readonly<{ value: number }>) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="grid gap-1" aria-label={`資料完整度 ${percent}%`}>
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>資料完整度</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <span
          className="block h-2 rounded-full bg-[var(--accent)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function ConcernRangeCard({
  title,
  status,
  range,
  confidence,
  completeness,
  explanation,
}: Readonly<{
  title: string;
  status: string;
  range?: string;
  confidence: EvidenceGrade;
  completeness: number;
  explanation: string;
}>) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <EvidenceGradeBadge grade={confidence} />
      </div>
      <p className="mt-3 text-sm font-semibold text-[var(--accent-strong)]">{status}</p>
      {range ? <p className="mt-1 text-sm text-[var(--muted)]">範圍：{range}</p> : null}
      <div className="mt-4">
        <DataCompletenessIndicator value={completeness} />
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-700">{explanation}</p>
    </article>
  );
}

export function SourceCitation({ source }: Readonly<{ source: SourceRecord }>) {
  return (
    <article className="rounded-lg border border-[var(--line)] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <EvidenceGradeBadge grade={source.evidenceGrade} />
        <span className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-xs text-slate-700">
          {source.sourceType}
        </span>
        {source.isDemo ? (
          <span className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900">開發示範</span>
        ) : null}
      </div>
      <h3 className="mt-3 font-semibold text-slate-950">{source.title}</h3>
      <dl className="mt-3 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-700">出版者</dt>
          <dd>{source.publisher}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">司法管轄區</dt>
          <dd>{source.jurisdiction ?? "未標示"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">定位</dt>
          <dd>{source.exactLocator ?? "未標示"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">取用日期</dt>
          <dd>{source.accessedAt ?? "未標示"}</dd>
        </div>
      </dl>
      {source.externalUrl ? (
        <a
          className="mt-3 inline-flex text-sm font-semibold text-[var(--accent-strong)] underline underline-offset-4"
          href={source.externalUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          外部來源
        </a>
      ) : null}
    </article>
  );
}

export function RegulatoryNotice({
  children,
  level = "info",
}: Readonly<{ children: React.ReactNode; level?: "info" | "warning" }>) {
  const Icon = level === "warning" ? AlertCircle : HelpCircle;
  return (
    <div
      className={clsx(
        "flex gap-3 rounded-lg border p-4 text-sm leading-7",
        level === "warning"
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-sky-200 bg-sky-50 text-sky-950",
      )}
    >
      <Icon aria-hidden="true" className="mt-1 shrink-0" size={18} />
      <div>{children}</div>
    </div>
  );
}

export function VerificationStatusBadge({ status }: Readonly<{ status: VerificationStatus }>) {
  const label: Record<VerificationStatus, string> = {
    pending_review: "待審核",
    reviewed: "已審核",
    needs_correction: "需要修正",
    rejected: "已拒絕",
  };
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
      <CheckCircle2 aria-hidden="true" size={14} />
      {label[status]}
    </span>
  );
}

export function OcrConfidenceBadge({ confidence }: Readonly<{ confidence: number }>) {
  return (
    <span className="inline-flex rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
      OCR 信心度 {Math.round(confidence * 100)}%
    </span>
  );
}

export function EmptyDataState({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--line)] bg-white p-8 text-center">
      <SearchX aria-hidden="true" className="mx-auto text-slate-400" size={34} />
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{body}</p>
    </div>
  );
}

export function InlineLink({
  href,
  children,
}: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link
      href={href}
      className="font-semibold text-[var(--accent-strong)] underline underline-offset-4"
    >
      {children}
    </Link>
  );
}
