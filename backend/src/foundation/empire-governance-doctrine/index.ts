export {
  governanceDoctrineArticleSchema,
  governanceComplianceReportSchema,
  authorityMatrixEntrySchema,
  GOVERNANCE_DOCTRINE_VERSION,
  GOVERNANCE_DOCTRINE_MISSION_ID,
} from "./models/governance-doctrine.js";
export type {
  GovernanceDoctrineArticle,
  GovernanceComplianceReport,
  GovernanceComplianceCheck,
  AuthorityMatrixEntry,
} from "./models/governance-doctrine.js";
export {
  GOVERNANCE_DOCTRINE_CATALOG,
  GOVERNANCE_AUTHORITY_MATRIX,
  getGovernanceDoctrine,
  listGovernanceDoctrines,
  listAuthorityMatrix,
} from "./catalog/gvd-catalog.js";
export {
  getGovernanceDoctrineCatalog,
  buildGovernanceComplianceReport,
  buildGovernanceDoctrineDashboard,
} from "./services/empire-governance-doctrine-service.js";
export { auditGovernanceCompliance, governanceExecutiveSummary } from "./services/governance-compliance-audit.js";
export { registerEmpireGovernanceDoctrineRoutes } from "./routes/empire-governance-doctrine-routes.js";
export { empireGovernanceDoctrineTools } from "./tools/empire-governance-doctrine-tools.js";
export const EMPIRE_GOVERNANCE_DOCTRINE_MODULE_ID = "empire-governance-doctrine" as const;
