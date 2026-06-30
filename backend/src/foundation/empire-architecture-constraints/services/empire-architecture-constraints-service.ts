import {
  ARCHITECTURE_CONSTRAINT_CATALOG,
  listArchitectureConstraints,
} from "../catalog/acd-catalog.js";
import type { ArchitectureComplianceReport, ArchitectureConstraintArticle } from "../models/architecture-constraint.js";
import {
  architectureExecutiveSummary,
  auditArchitectureCompliance,
} from "./architecture-compliance-audit.js";

export function getArchitectureConstraintCatalog(): readonly ArchitectureConstraintArticle[] {
  return ARCHITECTURE_CONSTRAINT_CATALOG;
}

export function buildArchitectureComplianceReport(
  workspaceId: string,
  companyId: string,
): ArchitectureComplianceReport {
  return auditArchitectureCompliance(workspaceId, companyId);
}

export function buildArchitectureConstraintsDashboard(
  workspaceId: string,
  companyId: string,
): {
  catalog: ArchitectureConstraintArticle[];
  compliance: ArchitectureComplianceReport;
  dependencyReview: ArchitectureComplianceReport["dependencyReview"];
  summary: string;
  immutable: true;
} {
  const compliance = buildArchitectureComplianceReport(workspaceId, companyId);
  return {
    catalog: listArchitectureConstraints(),
    compliance,
    dependencyReview: compliance.dependencyReview,
    summary: architectureExecutiveSummary(compliance),
    immutable: true,
  };
}
