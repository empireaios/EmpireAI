import {
  listIdentityDoctrines,
  listUxDoctrines,
  listUxIdentityDoctrines,
  UX_IDENTITY_DOCTRINE_CATALOG,
} from "../catalog/uid-catalog.js";
import type { UxIdentityComplianceReport, UxIdentityDoctrineArticle } from "../models/ux-identity-doctrine.js";
import {
  auditUxIdentityCompliance,
  uxIdentityExecutiveSummary,
} from "./ux-identity-compliance-audit.js";

export function getUxIdentityDoctrineCatalog(): readonly UxIdentityDoctrineArticle[] {
  return UX_IDENTITY_DOCTRINE_CATALOG;
}

export function buildUxIdentityComplianceReport(
  workspaceId: string,
  companyId: string,
): UxIdentityComplianceReport {
  return auditUxIdentityCompliance(workspaceId, companyId);
}

export function buildUxIdentityDoctrineDashboard(
  workspaceId: string,
  companyId: string,
): {
  catalog: UxIdentityDoctrineArticle[];
  identityCoverage: string[];
  uxCoverage: string[];
  navigationReview: UxIdentityComplianceReport["navigationReview"];
  compliance: UxIdentityComplianceReport;
  summary: string;
  immutable: true;
} {
  const compliance = buildUxIdentityComplianceReport(workspaceId, companyId);
  return {
    catalog: listUxIdentityDoctrines(),
    identityCoverage: listIdentityDoctrines().map((d) => d.doctrineId),
    uxCoverage: listUxDoctrines().map((d) => d.doctrineId),
    navigationReview: compliance.navigationReview,
    compliance,
    summary: uxIdentityExecutiveSummary(compliance),
    immutable: true,
  };
}
