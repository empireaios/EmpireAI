export { version1GoldMasterSchema, version1GoldCertificateSchema } from "./models/version-1-gold-master.js";
export type { Version1GoldMaster } from "./models/version-1-gold-master.js";
export { buildVersion1GoldMaster } from "./services/version-1-gold-master-service.js";
export { registerVersion1GoldMasterRoutes } from "./routes/version-1-gold-master-routes.js";
export { version1GoldMasterTools } from "./tools/version-1-gold-master-tools.js";
export const VERSION_1_GOLD_MASTER_MODULE_ID = "version-1-gold-master" as const;
export const VERSION_1_GOLD_MASTER_MISSION_ID = "REAL-050" as const;
