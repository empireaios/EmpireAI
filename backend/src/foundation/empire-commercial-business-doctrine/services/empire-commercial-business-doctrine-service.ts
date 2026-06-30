import {
  COMMERCIAL_BUSINESS_DOCTRINE_CATALOG,
  listCommercialBusinessDoctrines,
} from "../catalog/cbd-catalog.js";
import type { CommercialComplianceReport, CommercialBusinessDoctrineArticle } from "../models/commercial-business-doctrine.js";
import {
  auditCommercialBusinessCompliance,
  commercialBusinessExecutiveSummary,
} from "./commercial-compliance-audit.js";

export function getCommercialBusinessDoctrineCatalog(): readonly CommercialBusinessDoctrineArticle[] {
  return COMMERCIAL_BUSINESS_DOCTRINE_CATALOG;
}

export function buildCommercialComplianceReport(
  workspaceId: string,
  companyId: string,
): CommercialComplianceReport {
  return auditCommercialBusinessCompliance(workspaceId, companyId);
}

export function buildCommercialBusinessDoctrineDashboard(
  workspaceId: string,
  companyId: string,
): {
  catalog: CommercialBusinessDoctrineArticle[];
  businessRuleCoverage: string[];
  commercialIntegrityReview: CommercialComplianceReport["commercialIntegrityReview"];
  compliance: CommercialComplianceReport;
  summary: string;
  immutable: true;
} {
  const compliance = buildCommercialComplianceReport(workspaceId, companyId);
  return {
    catalog: listCommercialBusinessDoctrines(),
    businessRuleCoverage: compliance.businessRuleCoverage,
    commercialIntegrityReview: compliance.commercialIntegrityReview,
    compliance,
    summary: commercialBusinessExecutiveSummary(compliance),
    immutable: true,
  };
}
