import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const src = "pillow/src/aliexpress-integration";
const dst = "pillow/src/1688-integration";

const fileMap = {
  "aex-logging.ts": "oss-logging.ts",
  "aliexpress-authentication-manager.ts": "oss1688-authentication-manager.ts",
  "aliexpress-api-client.ts": "oss1688-api-client.ts",
  "aliexpress-connector-controller.ts": "oss1688-connector-controller.ts",
  "aliexpress-connector-manager.ts": "oss1688-connector-manager.ts",
  "aliexpress-event-webhook-adapter.ts": "oss1688-event-webhook-adapter.ts",
  "aliexpress-metadata-generator.ts": "oss1688-metadata-generator.ts",
  "aliexpress-rate-limit-manager.ts": "oss1688-rate-limit-manager.ts",
  "aliexpress-request-router.ts": "oss1688-request-router.ts",
  "aliexpress-response-handler.ts": "oss1688-response-handler.ts",
  "aliexpress-retry-manager.ts": "oss1688-retry-manager.ts",
  "aliexpress-validator.ts": "oss1688-validator.ts",
};

const sameFiles = [
  "paths.ts",
  "types.ts",
  "configuration.ts",
  "engine.ts",
  "index.ts",
  "health-monitor.ts",
  "recovery-manager.ts",
];

function transform(content) {
  return content
    .replaceAll("PILLOW-AEX-001", "PILLOW-1688-001")
    .replaceAll("R2-03", "R2-04")
    .replaceAll("AliExpress Integration", "1688 Integration")
    .replaceAll("AliExpress connector", "1688 connector")
    .replaceAll("AliExpress with", "1688 with")
    .replaceAll("AliExpress credential", "1688 credential")
    .replaceAll("AliExpress Integration not", "1688 Integration not")
    .replaceAll("R2-03 AliExpress", "R2-04 1688")
    .replaceAll("AliExpressIntegration", "Oss1688Integration")
    .replaceAll("AliExpressConnector", "Oss1688Connector")
    .replaceAll("AliExpressAuthentication", "Oss1688Authentication")
    .replaceAll("AliExpressApi", "Oss1688Api")
    .replaceAll("AliExpressRequest", "Oss1688Request")
    .replaceAll("AliExpressResponse", "Oss1688Response")
    .replaceAll("AliExpressEvent", "Oss1688Event")
    .replaceAll("AliExpressRate", "Oss1688Rate")
    .replaceAll("AliExpressRetry", "Oss1688Retry")
    .replaceAll("AliExpressValidator", "Oss1688Validator")
    .replaceAll("AliExpressMetadata", "Oss1688Metadata")
    .replaceAll("AliExpressAuth", "Oss1688Auth")
    .replaceAll("AliExpressConnection", "Oss1688Connection")
    .replaceAll("AliExpressWebhook", "Oss1688Webhook")
    .replaceAll("AliExpressValidation", "Oss1688Validation")
    .replaceAll("AliExpressHealth", "Oss1688Health")
    .replaceAll("AliExpressPerformance", "Oss1688Performance")
    .replaceAll("AliExpressLog", "Oss1688Log")
    .replaceAll("AliExpressCockpit", "Oss1688Cockpit")
    .replaceAll("AliExpressCapability", "Oss1688Capability")
    .replaceAll("connectAliExpress", "connectOss1688")
    .replaceAll("routeAliExpressApi", "routeOss1688Api")
    .replaceAll("handleAliExpressWebhook", "handleOss1688Webhook")
    .replaceAll("buildAliExpress", "buildOss1688")
    .replaceAll("createAliExpress", "createOss1688")
    .replaceAll("resetAliExpress", "resetOss1688")
    .replaceAll("requirePillowAliExpress", "requirePillowOss1688")
    .replaceAll("appendAexLog", "appendOssLog")
    .replaceAll("getAexLogs", "getOssLogs")
    .replaceAll("resetAexLogsForTesting", "resetOssLogsForTesting")
    .replaceAll("ALIEXPRESS_INTEGRATION", "OSS1688_INTEGRATION")
    .replaceAll("AEX_CONNECTOR_METADATA", "OSS1688_CONNECTOR_METADATA")
    .replaceAll("AEX_SUPPLIER_ID", "OSS1688_SUPPLIER_ID")
    .replaceAll("AEX_CAPABILITIES", "OSS1688_CAPABILITIES")
    .replaceAll("AEX_API_ENDPOINTS", "OSS1688_API_ENDPOINTS")
    .replaceAll("AEX-001-v1", "OSS-001-v1")
    .replaceAll("aex-logging.js", "oss-logging.js")
    .replaceAll("aliexpress-authentication-manager.js", "oss1688-authentication-manager.js")
    .replaceAll("aliexpress-api-client.js", "oss1688-api-client.js")
    .replaceAll("aliexpress-connector-controller.js", "oss1688-connector-controller.js")
    .replaceAll("aliexpress-connector-manager.js", "oss1688-connector-manager.js")
    .replaceAll("aliexpress-event-webhook-adapter.js", "oss1688-event-webhook-adapter.js")
    .replaceAll("aliexpress-metadata-generator.js", "oss1688-metadata-generator.js")
    .replaceAll("aliexpress-rate-limit-manager.js", "oss1688-rate-limit-manager.js")
    .replaceAll("aliexpress-request-router.js", "oss1688-request-router.js")
    .replaceAll("aliexpress-response-handler.js", "oss1688-response-handler.js")
    .replaceAll("aliexpress-retry-manager.js", "oss1688-retry-manager.js")
    .replaceAll("aliexpress-validator.js", "oss1688-validator.js")
    .replaceAll("aex-run-", "oss-run-")
    .replaceAll("aex-val-", "oss-val-")
    .replaceAll("aex-req-", "oss-req-")
    .replaceAll("aex-evt-", "oss-evt-")
    .replaceAll("aex-log-", "oss-log-")
    .replaceAll("`aex-", "`oss-")
    .replaceAll('startsWith("aex-")', 'startsWith("oss-")')
    .replaceAll("aliexpress_authentication", "1688_authentication")
    .replaceAll("aliexpress_connection_testing", "1688_connection_testing")
    .replaceAll("vault://aliexpress-api", "vault://1688-api")
    .replaceAll("aliexpress-integration.config.json", "1688-integration.config.json")
    .replaceAll("EMPIREAI_ALIEXPRESS_INTEGRATION_SYSTEM.md", "EMPIREAI_1688_INTEGRATION_SYSTEM.md")
    .replaceAll(
      "https://api-sg.aliexpress.com/sync",
      "https://gw.open.1688.com/openapi",
    )
    .replaceAll('supplierId: "aliexpress"', 'supplierId: "1688"')
    .replaceAll('record.supplierId !== "aliexpress"', 'record.supplierId !== "1688"')
    .replaceAll('supplierIdentifier: AEX_SUPPLIER_ID', 'supplierIdentifier: OSS1688_SUPPLIER_ID')
    .replaceAll("Invalid AliExpress connector ID prefix", "Invalid 1688 connector ID prefix");
}

mkdirSync(dst, { recursive: true });

for (const [from, to] of Object.entries(fileMap)) {
  const content = transform(readFileSync(join(src, from), "utf8"));
  writeFileSync(join(dst, to), content);
}

for (const file of sameFiles) {
  const content = transform(readFileSync(join(src, file), "utf8"));
  writeFileSync(join(dst, file), content);
}

console.log("1688 integration module generated.");
