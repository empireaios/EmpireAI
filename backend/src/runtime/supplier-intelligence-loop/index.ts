export {
  SUPPLIER_LOOP_SIGNALS,
  supplierLoopSignalSchema,
  supplierIntelligenceLoopSchema,
} from "./models/supplier-intelligence-loop.js";

export type { SupplierIntelligenceLoop } from "./models/supplier-intelligence-loop.js";

export { buildSupplierIntelligenceLoop } from "./services/supplier-intelligence-loop-service.js";
export { registerSupplierIntelligenceLoopRoutes } from "./routes/supplier-intelligence-loop-routes.js";
export { supplierIntelligenceLoopTools } from "./tools/supplier-intelligence-loop-tools.js";

export const SUPPLIER_INTELLIGENCE_LOOP_MODULE_ID = "supplier-intelligence-loop" as const;
export const SUPPLIER_INTELLIGENCE_LOOP_MISSION_ID = "REAL-015" as const;
