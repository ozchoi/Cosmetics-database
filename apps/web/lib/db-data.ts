import "server-only";

import { getPrismaClient } from "@cosmetic-lens/database";
import type {
  ProductIngredientRecord,
  ProductRecord,
  ProductVersionRecord,
} from "@cosmetic-lens/shared";

interface ProductRow {
  product_id: string;
  product_external_seed_id: string | null;
  product_slug: string;
  preferred_name: string;
  description_zh_hant: string | null;
  brand_name: string;
  brand_slug: string;
  version_id: string;
  version_external_seed_id: string | null;
  market_code: string;
  category: string | null;
  product_form: string;
  usage_type: string;
  body_area: string[];
  target_user_group: string | null;
  label_observed_at: Date | null;
  last_independent_verification_at: Date | null;
  brand_confirmed_at: Date | null;
  formula_hash: string;
  source_ids_json: unknown;
  source_warning_zh: string | null;
  source_url: string | null;
  source_accessed_at: Date | null;
  package_photo_verified: boolean;
  verification_status: string;
  publication_status: string;
  submitted_at: Date | null;
  evidence_confidence: string;
  data_completeness: unknown;
}

interface IngredientRow {
  version_external_seed_id: string | null;
  position: number;
  raw_label_token: string;
  normalised_token: string;
  match_status: string;
  match_method: string | null;
  match_confidence: unknown;
  notes: string | null;
  ingredient_slug: string | null;
}

export const listDatabaseProducts = async (): Promise<ProductRecord[]> => {
  if (!process.env["DATABASE_URL"]) {
    throw new Error("DATABASE_URL is required for database product reads.");
  }

  const db = getPrismaClient();
  const rows = await db.$queryRaw<ProductRow[]>`
    select
      p.id::text as product_id,
      p.external_seed_id as product_external_seed_id,
      p.slug as product_slug,
      p.preferred_name,
      p.description_zh_hant,
      b.preferred_name as brand_name,
      b.slug as brand_slug,
      pv.id::text as version_id,
      pv.external_seed_id as version_external_seed_id,
      pv.market_code,
      c.name_zh_hant as category,
      pv.product_form::text,
      pv.usage_type::text,
      pv.body_area,
      pv.target_user_group,
      pv.label_observed_at,
      pv.last_independent_verification_at,
      pv.brand_confirmed_at,
      pv.formula_hash,
      pv.source_ids_json,
      pv.source_warning_zh,
      pv.source_url,
      pv.source_accessed_at,
      pv.package_photo_verified,
      pv.verification_status::text,
      pv.publication_status::text,
      pv.submitted_at,
      pv.evidence_confidence::text,
      pv.data_completeness
    from product_versions pv
    join products p on p.id = pv.product_id
    join brands b on b.id = p.brand_id
    left join categories c on c.id = pv.category_id
    where pv.publication_status in ('published', 'published_with_source_warning')
    order by b.preferred_name, p.preferred_name, pv.label_observed_at desc nulls last
  `;
  if (rows.length === 0) return [];

  const ingredients = await db.$queryRaw<IngredientRow[]>`
    select
      pv.external_seed_id as version_external_seed_id,
      pi.position,
      pi.raw_label_token,
      pi.normalised_token,
      pi.match_status::text,
      pi.match_method::text,
      pi.match_confidence,
      pi.notes,
      i.slug as ingredient_slug
    from product_ingredients pi
    join product_versions pv on pv.id = pi.product_version_id
    left join ingredients i on i.id = pi.ingredient_id
    order by pv.external_seed_id, pi.position
  `;
  const ingredientsByVersion = new Map<string, ProductIngredientRecord[]>();
  for (const item of ingredients) {
    if (!item.version_external_seed_id) continue;
    const next = {
      position: item.position,
      rawLabelToken: item.raw_label_token,
      normalisedToken: item.normalised_token,
      ...(item.ingredient_slug ? { ingredientSlug: item.ingredient_slug } : {}),
      matchStatus: item.match_status === "unresolved" ? "unresolved" : "confirmed",
      rawMatchStatus: item.match_status,
      ...(item.match_method ? { matchMethod: item.match_method } : {}),
      matchConfidence: Number(item.match_confidence ?? 0),
      ...(item.notes ? { notes: item.notes } : {}),
    } satisfies ProductIngredientRecord;
    ingredientsByVersion.set(item.version_external_seed_id, [
      ...(ingredientsByVersion.get(item.version_external_seed_id) ?? []),
      next,
    ]);
  }

  const grouped = new Map<string, ProductRecord>();
  for (const row of rows) {
    const product =
      grouped.get(row.product_id) ??
      ({
        id: row.product_external_seed_id ?? row.product_id,
        slug: row.product_slug,
        brand: row.brand_name,
        brandSlug: row.brand_slug,
        preferredName: row.preferred_name,
        descriptionZhHant: row.description_zh_hant ?? "",
        versions: [],
      } satisfies ProductRecord);
    product.versions.push(mapVersion(row, ingredientsByVersion));
    grouped.set(row.product_id, product);
  }
  return [...grouped.values()];
};

export const tryListDatabaseProducts = async (): Promise<ProductRecord[] | undefined> => {
  try {
    return await listDatabaseProducts();
  } catch {
    return undefined;
  }
};

const mapVersion = (
  row: ProductRow,
  ingredientsByVersion: Map<string, ProductIngredientRecord[]>,
): ProductVersionRecord => ({
  id: row.version_external_seed_id ?? row.version_id,
  versionLabel: row.version_external_seed_id ?? row.version_id,
  marketCode: row.market_code === "Hong Kong" ? "香港" : row.market_code,
  category: row.category ?? "unknown",
  productForm: row.product_form as ProductVersionRecord["productForm"],
  usageType: row.usage_type as ProductVersionRecord["usageType"],
  bodyArea: row.body_area,
  targetUserGroup: row.target_user_group ?? "未指定",
  labelObservedAt: dateOnly(row.label_observed_at),
  ...(row.last_independent_verification_at
    ? { lastIndependentVerificationAt: dateOnly(row.last_independent_verification_at) }
    : {}),
  ...(row.brand_confirmed_at ? { brandConfirmedAt: dateOnly(row.brand_confirmed_at) } : {}),
  conflictingNewerSubmissionCount: 0,
  marketSpecificEvidenceCount: 0,
  formulaHash: row.formula_hash,
  verificationStatus: row.verification_status as ProductVersionRecord["verificationStatus"],
  publicationStatus: row.publication_status as ProductVersionRecord["publicationStatus"],
  ...(row.submitted_at ? { submittedAt: dateOnly(row.submitted_at) } : {}),
  evidenceConfidence: row.evidence_confidence as ProductVersionRecord["evidenceConfidence"],
  dataCompleteness: Number(row.data_completeness ?? 0),
  concernDimensionValues: {},
  ingredients: row.version_external_seed_id
    ? (ingredientsByVersion.get(row.version_external_seed_id) ?? [])
    : [],
  sourceIds: Array.isArray(row.source_ids_json) ? row.source_ids_json.map(String) : [],
  ...(row.source_warning_zh ? { sourceWarningZh: row.source_warning_zh } : {}),
  ...(row.source_url ? { sourceUrl: row.source_url } : {}),
  ...(row.source_accessed_at ? { sourceAccessedAt: dateOnly(row.source_accessed_at) } : {}),
  packagePhotoVerified: row.package_photo_verified,
  rawVerificationStatus: row.verification_status,
});

const dateOnly = (value: Date | null): string => value?.toISOString().slice(0, 10) ?? "";
