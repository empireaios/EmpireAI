export {
  uxIdentityDoctrineArticleSchema,
  uxIdentityComplianceReportSchema,
  navigationReviewEntrySchema,
  UX_IDENTITY_DOCTRINE_VERSION,
  UX_IDENTITY_DOCTRINE_MISSION_ID,
} from "./models/ux-identity-doctrine.js";
export type {
  UxIdentityDoctrineArticle,
  UxIdentityComplianceReport,
  UxIdentityComplianceCheck,
  NavigationReviewEntry,
} from "./models/ux-identity-doctrine.js";
export {
  UX_IDENTITY_DOCTRINE_CATALOG,
  getUxIdentityDoctrine,
  listUxIdentityDoctrines,
  listIdentityDoctrines,
  listUxDoctrines,
} from "./catalog/uid-catalog.js";
export {
  getUxIdentityDoctrineCatalog,
  buildUxIdentityComplianceReport,
  buildUxIdentityDoctrineDashboard,
} from "./services/empire-ux-identity-doctrine-service.js";
export {
  auditUxIdentityCompliance,
  uxIdentityExecutiveSummary,
} from "./services/ux-identity-compliance-audit.js";
export { registerEmpireUxIdentityDoctrineRoutes } from "./routes/empire-ux-identity-doctrine-routes.js";
export { empireUxIdentityDoctrineTools } from "./tools/empire-ux-identity-doctrine-tools.js";
export const EMPIRE_UX_IDENTITY_DOCTRINE_MODULE_ID = "empire-ux-identity-doctrine" as const;
