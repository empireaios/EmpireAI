export {
  architectureConstraintArticleSchema,
  architectureComplianceReportSchema,
  dependencyReviewEntrySchema,
  ARCHITECTURE_CONSTRAINT_VERSION,
  ARCHITECTURE_CONSTRAINT_MISSION_ID,
} from "./models/architecture-constraint.js";
export type {
  ArchitectureConstraintArticle,
  ArchitectureComplianceReport,
  ArchitectureComplianceCheck,
  DependencyReviewEntry,
} from "./models/architecture-constraint.js";
export {
  ARCHITECTURE_CONSTRAINT_CATALOG,
  getArchitectureConstraint,
  listArchitectureConstraints,
} from "./catalog/acd-catalog.js";
export {
  getArchitectureConstraintCatalog,
  buildArchitectureComplianceReport,
  buildArchitectureConstraintsDashboard,
} from "./services/empire-architecture-constraints-service.js";
export {
  auditArchitectureCompliance,
  architectureExecutiveSummary,
} from "./services/architecture-compliance-audit.js";
export { registerEmpireArchitectureConstraintsRoutes } from "./routes/empire-architecture-constraints-routes.js";
export { empireArchitectureConstraintsTools } from "./tools/empire-architecture-constraints-tools.js";
export const EMPIRE_ARCHITECTURE_CONSTRAINTS_MODULE_ID = "empire-architecture-constraints" as const;
