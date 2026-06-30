export {
  ACCESS_STATE_VALUES,
  ACCESS_STATE_TRANSITIONS,
  mapToAccessState,
  isOperationalAccessState,
} from "./models/access-state-machine.js";

export type { AccessState, AccessStateTransition } from "./models/access-state-machine.js";

export {
  EMPIRE_ACCESS_PLATFORMS,
  PLATFORM_CATEGORIES,
  empireAccessRecordSchema,
  empireAccessRegistrySchema,
  getEmpirePlatform,
} from "./models/empire-platform-catalog.js";

export type { EmpirePlatformDefinition, EmpireAccessRecord, EmpireAccessRegistry } from "./models/empire-platform-catalog.js";

export {
  PERMISSION_TYPES,
  buildPermissionMatrix,
  getSupportedPermissions,
  platformPermissionMatrixSchema,
} from "./models/permission-matrix.js";

export type { PermissionType, PlatformPermissionMatrix } from "./models/permission-matrix.js";

export {
  APPROVAL_BOUNDARY_TYPES,
  ACTION_BOUNDARIES,
  ACTION_BOUNDARY_RULES,
  classifyAction,
  listBoundariesForPlatform,
} from "./models/approval-boundary.js";

export type { ApprovalBoundaryType, ActionBoundary, ActionBoundaryRule } from "./models/approval-boundary.js";

export {
  buildAmazonAccessReadiness,
  buildCjAccessReadiness,
  buildMarketplaceAccessReadiness,
  FUTURE_MARKETPLACE_IDS,
  amazonAccessReadinessSchema,
  cjAccessReadinessSchema,
  marketplaceAccessReadinessSchema,
} from "./models/platform-readiness.js";

export type {
  AmazonAccessReadiness,
  CjAccessReadiness,
  MarketplaceAccessReadiness,
} from "./models/platform-readiness.js";

export { accessDashboardSchema } from "./models/access-dashboard.js";
export type { AccessDashboard } from "./models/access-dashboard.js";

export {
  buildEmpireAccessRegistry,
  getEmpireAccessRecord,
  getPermissionMatrixForPlatform,
  resetEmpireAccessRegistry,
} from "./services/empire-access-registry-service.js";

export { buildAccessDashboard } from "./services/access-dashboard-service.js";
export { inspectOperationalAccessCoverage } from "./services/operational-access-esis-inspector.js";

export { registerOperationalAccessRoutes } from "./routes/operational-access-routes.js";
export { operationalAccessTools } from "./tools/operational-access-tools.js";

export const OPERATIONAL_ACCESS_MODULE_ID = "operational-access" as const;
export const OPERATIONAL_ACCESS_MISSION_IDS = [
  "OAR-001", "OAR-002", "OAR-003", "OAR-004", "OAR-005",
  "OAR-006", "OAR-007", "OAR-008", "OAR-009", "OAR-010",
] as const;
