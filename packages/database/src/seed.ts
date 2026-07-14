import { PrismaClient } from "@prisma/client";
import { ingredientFixtures, productFixtures, sourceFixtures } from "@cosmetic-lens/shared";

const prisma = new PrismaClient();

const normalise = (value: string): string =>
  value.normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/gu, " ").trim();

const optional = <T>(value: T | undefined): T | null => value ?? null;

async function seedSources(): Promise<void> {
  for (const source of sourceFixtures) {
    const existing = await prisma.source.findFirst({
      where: {
        publisher: source.publisher,
        title: source.title,
        exactLocator: optional(source.exactLocator),
      },
    });

    const data = {
      publisher: source.publisher,
      title: source.title,
      sourceType: source.sourceType,
      jurisdiction: optional(source.jurisdiction),
      publicationDate: source.publicationDate ? new Date(source.publicationDate) : null,
      version: optional(source.version),
      externalUrl: optional(source.externalUrl),
      exactLocator: optional(source.exactLocator),
      accessedAt: source.accessedAt ? new Date(source.accessedAt) : null,
      languageCode: optional(source.languageCode),
      licenceStatus: source.licenceStatus,
      commercialReuseStatus: source.commercialReuseStatus,
      reviewStatus: source.reviewStatus,
      evidenceRelationship: source.evidenceRelationship ?? null,
      evidenceGrade: source.evidenceGrade,
      isDemo: source.isDemo ?? false,
    };

    if (existing) {
      await prisma.source.update({ where: { id: existing.id }, data });
    } else {
      await prisma.source.create({ data });
    }
  }
}

async function seedIngredients(): Promise<void> {
  for (const ingredient of ingredientFixtures) {
    const saved = await prisma.ingredient.upsert({
      where: { slug: ingredient.slug },
      update: {
        canonicalInciName: ingredient.canonicalInciName,
        preferredEnglishName: ingredient.preferredEnglishName,
        preferredZhHantHkName: ingredient.preferredZhHantHkName,
        ingredientType: ingredient.ingredientType,
        descriptionZhHant: ingredient.descriptionZhHant,
        reviewStatus: ingredient.reviewStatus,
      },
      create: {
        slug: ingredient.slug,
        canonicalInciName: ingredient.canonicalInciName,
        preferredEnglishName: ingredient.preferredEnglishName,
        preferredZhHantHkName: ingredient.preferredZhHantHkName,
        ingredientType: ingredient.ingredientType,
        descriptionZhHant: ingredient.descriptionZhHant,
        reviewStatus: ingredient.reviewStatus,
      },
    });

    await prisma.ingredientName.deleteMany({ where: { ingredientId: saved.id } });

    for (const alias of ingredient.aliases) {
      await prisma.ingredientName.create({
        data: {
          ingredientId: saved.id,
          name: alias.name,
          normalisedName: normalise(alias.name),
          languageCode: alias.languageCode,
          regionCode: optional(alias.regionCode),
          nameType: alias.nameType,
          reviewStatus: alias.reviewed ? "reviewed" : "draft",
        },
      });
    }
  }
}

async function seedProducts(): Promise<void> {
  for (const product of productFixtures) {
    const brand = await prisma.brand.upsert({
      where: { slug: product.brandSlug },
      update: { preferredName: product.brand },
      create: { slug: product.brandSlug, preferredName: product.brand },
    });

    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        preferredName: product.preferredName,
        descriptionZhHant: product.descriptionZhHant,
      },
      create: {
        slug: product.slug,
        brandId: brand.id,
        preferredName: product.preferredName,
        descriptionZhHant: product.descriptionZhHant,
      },
    });

    for (const version of product.versions) {
      const categoryCode = normalise(version.category).replace(/\s+/gu, "-");
      const category = await prisma.category.upsert({
        where: { code: categoryCode },
        update: { nameZhHant: version.category },
        create: { code: categoryCode, nameZhHant: version.category },
      });

      const savedVersion = await prisma.productVersion.upsert({
        where: {
          productId_marketCode_formulaHash: {
            productId: savedProduct.id,
            marketCode: version.marketCode,
            formulaHash: version.formulaHash,
          },
        },
        update: {
          barcode: optional(version.barcode),
          categoryId: category.id,
          productForm: version.productForm,
          usageType: version.usageType,
          bodyArea: version.bodyArea,
          targetUserGroup: version.targetUserGroup,
          labelObservedAt: new Date(version.labelObservedAt),
          lastIndependentVerificationAt: version.lastIndependentVerificationAt
            ? new Date(version.lastIndependentVerificationAt)
            : null,
          brandConfirmedAt: version.brandConfirmedAt ? new Date(version.brandConfirmedAt) : null,
          conflictingNewerSubmissionCount: version.conflictingNewerSubmissionCount ?? 0,
          marketSpecificEvidenceCount: version.marketSpecificEvidenceCount ?? 0,
          verificationStatus: version.verificationStatus,
          publicationStatus: version.publicationStatus,
          submittedAt: version.submittedAt ? new Date(version.submittedAt) : null,
          evidenceConfidence: version.evidenceConfidence,
          dataCompleteness: version.dataCompleteness,
          concernDimensionValues: version.concernDimensionValues,
        },
        create: {
          productId: savedProduct.id,
          marketCode: version.marketCode,
          barcode: optional(version.barcode),
          categoryId: category.id,
          productForm: version.productForm,
          usageType: version.usageType,
          bodyArea: version.bodyArea,
          targetUserGroup: version.targetUserGroup,
          labelObservedAt: new Date(version.labelObservedAt),
          lastIndependentVerificationAt: version.lastIndependentVerificationAt
            ? new Date(version.lastIndependentVerificationAt)
            : null,
          brandConfirmedAt: version.brandConfirmedAt ? new Date(version.brandConfirmedAt) : null,
          conflictingNewerSubmissionCount: version.conflictingNewerSubmissionCount ?? 0,
          marketSpecificEvidenceCount: version.marketSpecificEvidenceCount ?? 0,
          formulaHash: version.formulaHash,
          verificationStatus: version.verificationStatus,
          publicationStatus: version.publicationStatus,
          submittedAt: version.submittedAt ? new Date(version.submittedAt) : null,
          evidenceConfidence: version.evidenceConfidence,
          dataCompleteness: version.dataCompleteness,
          concernDimensionValues: version.concernDimensionValues,
        },
      });

      for (const ingredient of version.ingredients) {
        const matchedIngredient = ingredient.ingredientSlug
          ? await prisma.ingredient.findUnique({ where: { slug: ingredient.ingredientSlug } })
          : null;

        await prisma.productIngredient.upsert({
          where: {
            productVersionId_position: {
              productVersionId: savedVersion.id,
              position: ingredient.position,
            },
          },
          update: {
            rawLabelToken: ingredient.rawLabelToken,
            normalisedToken: normalise(ingredient.rawLabelToken),
            ingredientId: matchedIngredient?.id ?? null,
            matchStatus: ingredient.matchStatus,
            matchConfidence: ingredient.matchConfidence,
          },
          create: {
            productVersionId: savedVersion.id,
            position: ingredient.position,
            rawLabelToken: ingredient.rawLabelToken,
            normalisedToken: normalise(ingredient.rawLabelToken),
            ingredientId: matchedIngredient?.id ?? null,
            matchMethod:
              ingredient.matchStatus === "confirmed" ? "exact_reviewed_alias" : "fuzzy_candidate",
            matchStatus: ingredient.matchStatus,
            matchConfidence: ingredient.matchConfidence,
          },
        });
      }
    }
  }
}

async function main(): Promise<void> {
  await seedSources();
  await seedIngredients();
  await seedProducts();
  await prisma.methodologyVersion.upsert({
    where: { name_semanticVersion: { name: "mvp-0.1", semanticVersion: "0.1.0" } },
    update: {},
    create: {
      name: "mvp-0.1",
      semanticVersion: "0.1.0",
      descriptionZhHant: "暫定 MVP 評估方法，只作開發展示；不代表醫療診斷或疾病機率。",
      configurationJson: {
        largestContributionWeight: 0.7,
        topThreeMeanWeight: 0.3,
      },
      effectiveFrom: new Date("2026-07-13"),
      publicationStatus: "draft",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
