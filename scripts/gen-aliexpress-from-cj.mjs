import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const src = "pillow/src/cj-dropshipping-integration";
const dst = "pillow/src/aliexpress-integration";

const fileMap = {
  "cj-logging.ts": "aex-logging.ts",
  "cj-authentication-manager.ts": "aliexpress-authentication-manager.ts",
  "cj-api-client.ts": "aliexpress-api-client.ts",
  "cj-connector-controller.ts": "aliexpress-connector-controller.ts",
  "cj-connector-manager.ts": "aliexpress-connector-manager.ts",
  "cj-event-webhook-adapter.ts": "aliexpress-event-webhook-adapter.ts",
  "cj-metadata-generator.ts": "aliexpress-metadata-generator.ts",
  "cj-rate-limit-manager.ts": "aliexpress-rate-limit-manager.ts",
  "cj-request-router.ts": "aliexpress-request-router.ts",
  "cj-response-handler.ts": "aliexpress-response-handler.ts",
  "cj-retry-manager.ts": "aliexpress-retry-manager.ts",
  "cj-validator.ts": "aliexpress-validator.ts",
};

const sameFiles = ["paths.ts", "types.ts", "configuration.ts", "engine.ts", "index.ts", "health-monitor.ts", "recovery-manager.ts"];

function transform(content) {
  return content
    .replaceAll("PILLOW-CJ-001", "PILLOW-AEX-001")
    .replaceAll("R2-02", "R2-03")
    .replaceAll("CJdropshipping", "AliExpress")
    .replaceAll("cjdropshipping", "aliexpress")
    .replaceAll("CJDROPSHIPPING", "ALIEXPRESS")
    .replaceAll("CJ_CONNECTOR_METADATA", "AEX_CONNECTOR_METADATA")
    .replaceAll("CJ_SUPPLIER_ID", "AEX_SUPPLIER_ID")
    .replaceAll("CJ_CAPABILITIES", "AEX_CAPABILITIES")
    .replaceAll("CJ_API_ENDPOINTS", "AEX_API_ENDPOINTS")
    .replaceAll("CjDropshippingIntegration", "AliExpressIntegration")
    .replaceAll("CjConnectorManager", "AliExpressConnectorManager")
    .replaceAll("CjConnectorController", "AliExpressConnectorController")
    .replaceAll("CjAuthenticationManager", "AliExpressAuthenticationManager")
    .replaceAll("CjApiClient", "AliExpressApiClient")
    .replaceAll("CjRequestRouter", "AliExpressRequestRouter")
    .replaceAll("CjResponseHandler", "AliExpressResponseHandler")
    .replaceAll("CjEventWebhookAdapter", "AliExpressEventWebhookAdapter")
    .replaceAll("CjRateLimitManager", "AliExpressRateLimitManager")
    .replaceAll("CjRetryManager", "AliExpressRetryManager")
    .replaceAll("CjValidator", "AliExpressValidator")
    .replaceAll("CjMetadataGenerator", "AliExpressMetadataGenerator")
    .replaceAll("CjConnectorRecord", "AliExpressConnectorRecord")
    .replaceAll("CjConnectorRunReport", "AliExpressConnectorRunReport")
    .replaceAll("ConnectCjDropshippingInput", "ConnectAliExpressInput")
    .replaceAll("RouteCjApiInput", "RouteAliExpressApiInput")
    .replaceAll("HandleCjWebhookInput", "HandleAliExpressWebhookInput")
    .replaceAll("CjAuthResult", "AliExpressAuthResult")
    .replaceAll("CjConnectionTestResult", "AliExpressConnectionTestResult")
    .replaceAll("CjApiRequest", "AliExpressApiRequest")
    .replaceAll("CjApiResponse", "AliExpressApiResponse")
    .replaceAll("CjWebhookResult", "AliExpressWebhookResult")
    .replaceAll("CjValidationReport", "AliExpressValidationReport")
    .replaceAll("CjHealthReport", "AliExpressHealthReport")
    .replaceAll("CjPerformanceStats", "AliExpressPerformanceStats")
    .replaceAll("CjLogEntry", "AliExpressLogEntry")
    .replaceAll("CjCockpitSnapshot", "AliExpressCockpitSnapshot")
    .replaceAll("connectCjDropshipping", "connectAliExpress")
    .replaceAll("routeCjApi", "routeAliExpressApi")
    .replaceAll("handleCjWebhook", "handleAliExpressWebhook")
    .replaceAll("appendCjLog", "appendAexLog")
    .replaceAll("getCjLogs", "getAexLogs")
    .replaceAll("resetCjLogsForTesting", "resetAexLogsForTesting")
    .replaceAll("cj-logging.js", "aex-logging.js")
    .replaceAll("cj-authentication-manager.js", "aliexpress-authentication-manager.js")
    .replaceAll("cj-api-client.js", "aliexpress-api-client.js")
    .replaceAll("cj-connector-controller.js", "aliexpress-connector-controller.js")
    .replaceAll("cj-connector-manager.js", "aliexpress-connector-manager.js")
    .replaceAll("cj-event-webhook-adapter.js", "aliexpress-event-webhook-adapter.js")
    .replaceAll("cj-metadata-generator.js", "aliexpress-metadata-generator.js")
    .replaceAll("cj-rate-limit-manager.js", "aliexpress-rate-limit-manager.js")
    .replaceAll("cj-request-router.js", "aliexpress-request-router.js")
    .replaceAll("cj-response-handler.js", "aliexpress-response-handler.js")
    .replaceAll("cj-retry-manager.js", "aliexpress-retry-manager.js")
    .replaceAll("cj-validator.js", "aliexpress-validator.js")
    .replaceAll("buildCjConnectorId", "buildAliExpressConnectorId")
    .replaceAll("buildCjRunReportId", "buildAliExpressRunReportId")
    .replaceAll("createCjDropshippingIntegrationEngine", "createAliExpressIntegrationEngine")
    .replaceAll("resetCjDropshippingIntegrationForTesting", "resetAliExpressIntegrationForTesting")
    .replaceAll("buildCjDropshippingIntegrationConfiguration", "buildAliExpressIntegrationConfiguration")
    .replaceAll("DEFAULT_CJDROPSHIPPING_INTEGRATION_CONFIGURATION", "DEFAULT_ALIEXPRESS_INTEGRATION_CONFIGURATION")
    .replaceAll("loadCjDropshippingIntegrationConfigFile", "loadAliExpressIntegrationConfigFile")
    .replaceAll("CjDropshippingIntegrationOptions", "AliExpressIntegrationOptions")
    .replaceAll("CjDropshippingIntegrationEngine", "AliExpressIntegrationEngine")
    .replaceAll("CjDropshippingIntegrationConfiguration", "AliExpressIntegrationConfiguration")
    .replaceAll("CjDropshippingIntegrationState", "AliExpressIntegrationState")
    .replaceAll("CjCapability", "AliExpressCapability")
    .replaceAll("cj-run-", "aex-run-")
    .replaceAll("cj-val-", "aex-val-")
    .replaceAll("cj-req-", "aex-req-")
    .replaceAll("cj-evt-", "aex-evt-")
    .replaceAll("cj-log-", "aex-log-")
    .replaceAll("`cj-", "`aex-")
    .replaceAll("CJ-001-v1", "AEX-001-v1")
    .replaceAll("cj_authentication", "aliexpress_authentication")
    .replaceAll("cj_connection_testing", "aliexpress_connection_testing")
    .replaceAll("cj-dropshipping-api", "aliexpress-api")
    .replaceAll("cj-dropshipping-integration.config.json", "aliexpress-integration.config.json")
    .replaceAll(
      "https://developers.cjdropshipping.com/api2.0/v1",
      "https://api-sg.aliexpress.com/sync",
    )
    .replaceAll('supplierId: "cj-dropshipping"', 'supplierId: "aliexpress"')
    .replaceAll('record.supplierId !== "cj-dropshipping"', 'record.supplierId !== "aliexpress"');
}

for (const [from, to] of Object.entries(fileMap)) {
  const content = transform(readFileSync(join(src, from), "utf8"));
  writeFileSync(join(dst, to), content);
}

for (const file of sameFiles) {
  const content = transform(readFileSync(join(src, file), "utf8"));
  writeFileSync(join(dst, file), content);
}

console.log("AliExpress integration module generated.");
