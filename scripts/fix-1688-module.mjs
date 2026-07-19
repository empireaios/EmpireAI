import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "pillow/src/1688-integration";

for (const file of readdirSync(dir)) {
  const path = join(dir, file);
  let content = readFileSync(path, "utf8");
  content = content
    .replaceAll("ConnectAliExpressInput", "ConnectOss1688Input")
    .replaceAll("AliExpress", "1688")
    .replaceAll(
      "EMPIREAI_OSS1688_INTEGRATION_SYSTEM.md",
      "EMPIREAI_1688_INTEGRATION_SYSTEM.md",
    )
    .replaceAll('OSS1688_SUPPLIER_ID = "aliexpress"', 'OSS1688_SUPPLIER_ID = "1688"');
  writeFileSync(path, content);
}

console.log("1688 integration fixes applied.");
