import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ContributionInput } from "./schemas";

export interface StoredSubmission extends ContributionInput {
  id: string;
  status: "pending_review" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  auditTrail: Array<{
    action: string;
    actor: string;
    at: string;
    notes?: string;
  }>;
}

const storePath = join(process.cwd(), ".local-data", "submissions.json");

const readStore = async (): Promise<StoredSubmission[]> => {
  try {
    const raw = await readFile(storePath, "utf8");
    return JSON.parse(raw) as StoredSubmission[];
  } catch {
    return [];
  }
};

const writeStore = async (submissions: StoredSubmission[]): Promise<void> => {
  await mkdir(join(process.cwd(), ".local-data"), { recursive: true });
  await writeFile(storePath, JSON.stringify(submissions, null, 2));
};

export const createSubmission = async (input: ContributionInput): Promise<StoredSubmission> => {
  const submissions = await readStore();
  const now = new Date().toISOString();
  const submission: StoredSubmission = {
    ...input,
    id: `sub_${globalThis.crypto.randomUUID()}`,
    status: "pending_review",
    submittedAt: now,
    auditTrail: [{ action: "created", actor: "public", at: now }],
  };
  submissions.unshift(submission);
  await writeStore(submissions);
  return submission;
};

export const listSubmissions = async (): Promise<StoredSubmission[]> => readStore();

export const reviewSubmission = async (
  id: string,
  status: "approved" | "rejected",
  actor: string,
  notes?: string,
): Promise<StoredSubmission | undefined> => {
  const submissions = await readStore();
  const index = submissions.findIndex((submission) => submission.id === id);
  if (index === -1) return undefined;
  const now = new Date().toISOString();
  const current = submissions[index]!;
  const updated: StoredSubmission = {
    ...current,
    status,
    reviewedAt: now,
    ...(notes ? { reviewNotes: notes } : {}),
    auditTrail: [
      ...current.auditTrail,
      { action: status, actor, at: now, ...(notes ? { notes } : {}) },
    ],
  };
  submissions[index] = updated;
  await writeStore(submissions);
  return updated;
};
