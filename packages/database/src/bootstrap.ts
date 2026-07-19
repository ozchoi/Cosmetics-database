import { dataSourcePolicyRecords } from "@cosmetic-lens/shared";
import { getPrismaClient } from "./client";

const prisma = getPrismaClient();

async function bootstrapDataSourcePolicies(): Promise<void> {
  for (const policy of dataSourcePolicyRecords) {
    await prisma.dataSourcePolicy.upsert({
      where: { sourceId: policy.sourceId },
      update: {
        sourceName: policy.sourceName,
        sourceDomain: policy.sourceDomain,
        sourceAccessClass: policy.sourceAccessClass,
        accessMethod: policy.accessMethod,
        licenceName: policy.licenceName,
        licenceUrl: policy.licenceUrl ?? null,
        attributionRequired: policy.attributionRequired,
        shareAlikeRequired: policy.shareAlikeRequired,
        commercialUseStatus: policy.commercialUseStatus,
        derivativeDatabaseRequirement: policy.derivativeDatabaseRequirement ?? null,
        imageReuseStatus: policy.imageReuseStatus,
        textReuseStatus: policy.textReuseStatus,
        automatedAccessAllowed: policy.automatedAccessAllowed,
        robotsReviewedAt: policy.robotsReviewedAt ? new Date(policy.robotsReviewedAt) : null,
        termsReviewedAt: policy.termsReviewedAt ? new Date(policy.termsReviewedAt) : null,
        legalReviewStatus: policy.legalReviewStatus,
        approvedFieldsJson: policy.approvedFieldsJson,
        prohibitedFieldsJson: policy.prohibitedFieldsJson,
        requiredAttributionText: policy.requiredAttributionText ?? null,
        importerEnabled: policy.importerEnabled,
        reviewNotes: policy.reviewNotes ?? null,
        reviewedBy: policy.reviewedBy ?? null,
        reviewedAt: policy.reviewedAt ? new Date(policy.reviewedAt) : null,
      },
      create: {
        sourceId: policy.sourceId,
        sourceName: policy.sourceName,
        sourceDomain: policy.sourceDomain,
        sourceAccessClass: policy.sourceAccessClass,
        accessMethod: policy.accessMethod,
        licenceName: policy.licenceName,
        licenceUrl: policy.licenceUrl ?? null,
        attributionRequired: policy.attributionRequired,
        shareAlikeRequired: policy.shareAlikeRequired,
        commercialUseStatus: policy.commercialUseStatus,
        derivativeDatabaseRequirement: policy.derivativeDatabaseRequirement ?? null,
        imageReuseStatus: policy.imageReuseStatus,
        textReuseStatus: policy.textReuseStatus,
        automatedAccessAllowed: policy.automatedAccessAllowed,
        robotsReviewedAt: policy.robotsReviewedAt ? new Date(policy.robotsReviewedAt) : null,
        termsReviewedAt: policy.termsReviewedAt ? new Date(policy.termsReviewedAt) : null,
        legalReviewStatus: policy.legalReviewStatus,
        approvedFieldsJson: policy.approvedFieldsJson,
        prohibitedFieldsJson: policy.prohibitedFieldsJson,
        requiredAttributionText: policy.requiredAttributionText ?? null,
        importerEnabled: policy.importerEnabled,
        reviewNotes: policy.reviewNotes ?? null,
        reviewedBy: policy.reviewedBy ?? null,
        reviewedAt: policy.reviewedAt ? new Date(policy.reviewedAt) : null,
      },
    });
  }
}

async function main(): Promise<void> {
  await bootstrapDataSourcePolicies();
  console.log(`Bootstrapped ${dataSourcePolicyRecords.length} data-source policies.`);
  console.log(
    "No fictional products, brands, evidence, regulatory rules, or placeholder ratings were inserted.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
