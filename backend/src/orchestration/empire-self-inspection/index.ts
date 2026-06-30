export { createEsisModuleContract, EMPIRE_SELF_INSPECTION_MODULE_ID, ESIS_CAPABILITIES } from "./contract/esis-module.js";
export type { EsisModuleContract, EsisCapability } from "./contract/esis-module.js";

export type {
  EsisInspectionReport,
  EsisDashboard,
  EsisFrontendPage,
  EsisBackendModule,
  EsisConnectorReport,
  EsisProductionReport,
  EsisHealthState,
} from "./models/esis-inspection.js";

export { runEsisInspection, generateReviewPackageOnly } from "./services/esis-engine.js";
export type { RunEsisInspectionInput } from "./services/esis-engine.js";
export { buildEsisDashboard } from "./services/esis-dashboard-service.js";
export { inspectFrontend } from "./services/frontend-inspector.js";
export { inspectBackend, listAllRestRoutes, listAllBrainTools, listAllDatabaseTables } from "./services/backend-inspector.js";
export { inspectCommerce } from "./services/commerce-inspector.js";
export { inspectConnectors } from "./services/connector-inspector.js";
export { inspectProduction } from "./services/production-inspector.js";
export { writeReviewPackage } from "./services/review-package-writer.js";
export { generateVisualMaps } from "./services/visual-map-generator.js";

export { registerEsisRoutes } from "./routes/esis-routes.js";
export { esisTools } from "./tools/esis-tools.js";
