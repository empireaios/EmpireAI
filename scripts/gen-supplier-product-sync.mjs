import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const src = "pillow/src/marketplace-product-normalization";
const dst = "pillow/src/supplier-product-sync";

const fileMap = {
  "mpn-logging.ts": "sps-logging.ts",
  "marketplace-product-normalization-manager.ts": "supplier-product-sync-manager.ts",
  "marketplace-product-normalization-controller.ts": "supplier-product-sync-controller.ts",
  "marketplace-product-mapper.ts": "supplier-product-mapper.ts",
  "marketplace-product-fixtures.ts": "supplier-product-fixtures.ts",
  "product-duplicate-detector.ts": "product-duplicate-detector.ts",
  "product-metadata-generator.ts": "product-metadata-generator.ts",
  "product-validation-engine.ts": "product-validation-engine.ts",
  "product-normalization-validator.ts": "product-validator.ts",
  "product-attribute-mapper.ts": "product-attribute-mapper.ts",
  "unified-product-schema-engine.ts": "supplier-catalog-engine.ts",
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
    .replaceAll("PILLOW-MPN-001", "PILLOW-SPS-001")
    .replaceAll("R1-12", "R2-05")
    .replaceAll("Marketplace Product Normalization", "Supplier Product Sync")
    .replaceAll("marketplace product normalization", "supplier product synchronization")
    .replaceAll("Product normalization", "Product synchronization")
    .replaceAll("product normalization", "product synchronization")
    .replaceAll("MarketplaceProductNormalization", "SupplierProductSync")
    .replaceAll("MarketplaceProductMapper", "SupplierProductMapper")
    .replaceAll("MarketplaceConnectorFrameworkEngine", "SupplierFrameworkEngine")
    .replaceAll("marketplaceConnectorFramework", "supplierFramework")
    .replaceAll("MarketplaceConnectorFramework", "SupplierFramework")
    .replaceAll("NormalizedProductRecord", "SupplierProductRecord")
    .replaceAll("ProductNormalizationReport", "SupplierProductSyncReport")
    .replaceAll("ProductNormalizationValidationReport", "SupplierProductSyncValidationReport")
    .replaceAll("ProductNormalizationHealthReport", "SupplierProductSyncHealthReport")
    .replaceAll("ProductNormalizationPerformanceStats", "SupplierProductSyncPerformanceStats")
    .replaceAll("ProductNormalizationLogEntry", "SupplierProductSyncLogEntry")
    .replaceAll("ProductNormalizationCockpitSnapshot", "SupplierProductSyncCockpitSnapshot")
    .replaceAll("ProductNormalizationValidator", "ProductValidator")
    .replaceAll("normalizeNormalizationResult", "validateSyncResult")
    .replaceAll("validateNormalizationResult", "validateSyncResult")
    .replaceAll("normalizeProducts", "syncSupplierProducts")
    .replaceAll("normalizeProduct", "receiveSupplierProduct")
    .replaceAll("NormalizeProductsInput", "SyncSupplierProductsInput")
    .replaceAll("NormalizeProductInput", "ReceiveSupplierProductInput")
    .replaceAll("normalizationReportId", "syncReportId")
    .replaceAll("normalizationTimestamp", "syncTimestamp")
    .replaceAll("normalizationRuns", "synchronizationRuns")
    .replaceAll("productsNormalized", "productsSynchronized")
    .replaceAll("lastNormalizationAt", "lastSynchronizationAt")
    .replaceAll("normalizationFailures", "synchronizationFailures")
    .replaceAll("normalization_start", "synchronization_start")
    .replaceAll("normalization_complete", "synchronization_complete")
    .replaceAll("normalization_failure", "synchronization_failure")
    .replaceAll("normalization_event", "synchronization_event")
    .replaceAll("normalizing", "syncing")
    .replaceAll("normalize", "sync")
    .replaceAll("NormalizationStatus", "SynchronizationStatus")
    .replaceAll("normalizationStatus", "synchronizationStatus")
    .replaceAll("normalizedAt", "synchronizedAt")
    .replaceAll('"normalized"', '"synchronized"')
    .replaceAll("RawMarketplaceProductPayload", "RawSupplierProductPayload")
    .replaceAll("marketplaceIdentifier", "supplierId")
    .replaceAll("marketplaceProductId", "supplierProductId")
    .replaceAll("marketplaceMetadata", "supplierMetadata")
    .replaceAll("MarketplaceIdentifier", "SupplierIdentifier")
    .replaceAll("SUPPORTED_MARKETPLACE_IDENTIFIERS", "SUPPORTED_SUPPLIER_IDENTIFIERS")
    .replaceAll("MARKETPLACE_PRODUCT_NORMALIZATION", "SUPPLIER_PRODUCT_SYNC")
    .replaceAll("MPN_METADATA_VERSION", "SPS_METADATA_VERSION")
    .replaceAll("UNIFIED_PRODUCT_SCHEMA_VERSION", "SUPPLIER_PRODUCT_CATALOG_VERSION")
    .replaceAll("MPN-001-v1", "SPS-001-v1")
    .replaceAll("MPN-SCHEMA-001-v1", "SPS-CATALOG-001-v1")
    .replaceAll("mpn-logging.js", "sps-logging.js")
    .replaceAll("marketplace-product-normalization-manager.js", "supplier-product-sync-manager.js")
    .replaceAll("marketplace-product-normalization-controller.js", "supplier-product-sync-controller.js")
    .replaceAll("marketplace-product-mapper.js", "supplier-product-mapper.js")
    .replaceAll("marketplace-product-fixtures.js", "supplier-product-fixtures.js")
    .replaceAll("product-normalization-validator.js", "product-validator.js")
    .replaceAll("unified-product-schema-engine.js", "supplier-catalog-engine.js")
    .replaceAll("appendNormalizationLog", "appendSpsLog")
    .replaceAll("getNormalizationLogs", "getSpsLogs")
    .replaceAll("resetNormalizationLogsForTesting", "resetSpsLogsForTesting")
    .replaceAll("buildNormalizationReportId", "buildSyncReportId")
    .replaceAll("buildNormalizationReport", "buildSyncReport")
    .replaceAll("mpn-run-", "sps-run-")
    .replaceAll("mpn-val-", "sps-val-")
    .replaceAll("mpn-log-", "sps-log-")
    .replaceAll("mpn-dup-", "sps-dup-")
    .replaceAll("`mpn-", "`sps-")
    .replaceAll('startsWith("mpn-")', 'startsWith("sps-")')
    .replaceAll("marketplace-product-normalization.config.json", "supplier-product-sync.config.json")
    .replaceAll("EMPIREAI_MARKETPLACE_PRODUCT_NORMALIZATION_SYSTEM.md", "EMPIREAI_SUPPLIER_PRODUCT_SYNC_SYSTEM.md")
    .replaceAll("marketplaceMappingRulesEnabled", "productMappingRulesEnabled")
    .replaceAll("productSchemaRulesEnabled", "productMappingRulesEnabled")
    .replaceAll("duplicateDetectionRulesEnabled", "changeDetectionRulesEnabled")
    .replaceAll("preserveSourceIdentifiers", "preserveSupplierProductIdentifiers")
    .replaceAll("mcf_consumption", "supplier_integration_consumption")
    .replaceAll("MCF available", "Supplier integrations available")
    .replaceAll("MCF consumed", "Supplier integrations consumed")
    .replaceAll("MCF consumption", "Supplier integration consumption")
    .replaceAll("getRegisteredConnectors", "getRegisteredSuppliers")
    .replaceAll("connector(s) available", "supplier(s) available")
    .replaceAll("UnifiedProductSchemaEngine", "SupplierCatalogEngine")
    .replaceAll("isSupportedMarketplace", "isSupportedSupplier")
    .replaceAll("Unsupported marketplace", "Unsupported supplier")
    .replaceAll("marketplace credential", "supplier credential")
    .replaceAll("matchType: \"marketplace_product_id\"", 'matchType: "supplier_product_id"');
}

mkdirSync(dst, { recursive: true });

for (const [from, to] of Object.entries(fileMap)) {
  writeFileSync(join(dst, to), transform(readFileSync(join(src, from), "utf8")));
}
for (const file of sameFiles) {
  writeFileSync(join(dst, file), transform(readFileSync(join(src, file), "utf8")));
}

console.log("Supplier product sync module generated.");
