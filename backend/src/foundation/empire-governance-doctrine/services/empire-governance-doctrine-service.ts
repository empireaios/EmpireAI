import {
  GOVERNANCE_DOCTRINE_CATALOG,
  listAuthorityMatrix,
  listGovernanceDoctrines,
} from "../catalog/gvd-catalog.js";
import type { GovernanceComplianceReport, GovernanceDoctrineArticle } from "../models/governance-doctrine.js";
import { auditGovernanceCompliance, governanceExecutiveSummary } from "./governance-compliance-audit.js";

export function getGovernanceDoctrineCatalog(): readonly GovernanceDoctrineArticle[] {
  return GOVERNANCE_DOCTRINE_CATALOG;
}

export function buildGovernanceComplianceReport(
  workspaceId: string,
  companyId: string,
): GovernanceComplianceReport {
  return auditGovernanceCompliance(workspaceId, companyId);
}

export function buildGovernanceDoctrineDashboard(
  workspaceId: string,
  companyId: string,
): {
  catalog: GovernanceDoctrineArticle[];
  authorityMatrix: ReturnType<typeof listAuthorityMatrix>;
  compliance: GovernanceComplianceReport;
  summary: string;
  immutable: true;
} {
  const compliance = buildGovernanceComplianceReport(workspaceId, companyId);
  return {
    catalog: listGovernanceDoctrines(),
    authorityMatrix: listAuthorityMatrix(),
    compliance,
    summary: governanceExecutiveSummary(compliance),
    immutable: true,
  };
}
