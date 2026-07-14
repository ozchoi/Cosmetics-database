import { dataSourcePolicyRecords } from "@cosmetic-lens/shared";
import { assertImporterAllowed } from "@cosmetic-lens/importers";

const failures = dataSourcePolicyRecords.flatMap((policy) => {
  if (!policy.importerEnabled) return [];
  return assertImporterAllowed(policy, policy.approvedFieldsJson).map((message) => ({
    sourceId: policy.sourceId,
    message,
  }));
});

console.log(
  JSON.stringify(
    {
      checked: dataSourcePolicyRecords.length,
      failures,
      warning: "公開網站可供瀏覽，並不代表可以大量複製、抓取或重新發布其資料。",
    },
    null,
    2,
  ),
);

if (failures.length > 0) process.exitCode = 1;
