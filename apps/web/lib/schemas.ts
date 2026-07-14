import { z } from "zod";

const formulationDiffItemSchema = z.object({
  raw: z.string().min(1).max(240),
  normalized: z.string().max(240),
  fromPosition: z.number().int().positive().optional(),
  toPosition: z.number().int().positive().optional(),
});

export const contributionSchema = z.object({
  contributionMode: z.enum(["instant_only", "text_only", "processed_image_and_text"]),
  consentConfirmed: z.boolean(),
  correctedText: z.string().min(2, "請輸入已確認的成分文字。").max(10_000),
  rawOcrText: z.string().max(10_000).optional(),
  productName: z.string().min(1, "請輸入產品名稱。").max(200),
  brandName: z.string().min(1, "請輸入品牌名稱。").max(200),
  marketCode: z.string().min(2).max(12),
  barcode: z.string().max(64).optional(),
  category: z.string().min(1).max(100),
  productForm: z.enum(["cream", "liquid", "gel", "powder", "spray", "aerosol", "stick", "unknown"]),
  usageType: z.enum(["leave_on", "rinse_off", "mixed", "unknown"]),
  bodyArea: z.array(z.string().min(1)).min(1),
  formulaHash: z.string().startsWith("sha256:"),
  imageSha256: z.string().optional(),
  comparedProductVersionId: z.string().max(120).optional(),
  formulationDiffSummary: z
    .object({
      comparedProductVersionId: z.string().max(120),
      reviewTaskType: z.literal("possible_reformulation_review"),
      hasChanges: z.boolean(),
      added: z.array(formulationDiffItemSchema).max(300),
      removed: z.array(formulationDiffItemSchema).max(300),
      reordered: z.array(formulationDiffItemSchema).max(300),
    })
    .optional(),
  notes: z.string().max(2000).optional(),
});

export type ContributionInput = z.infer<typeof contributionSchema>;
