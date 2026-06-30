import { CORE_CONSTITUTION_CATALOG, listConstitutionArticles } from "../catalog/ctd-catalog.js";
import type { ConstitutionComplianceReport, CoreConstitutionArticle } from "../models/core-constitution.js";
import { auditConstitutionCompliance, constitutionExecutiveSummary } from "./constitution-compliance-audit.js";

export function getCoreConstitutionCatalog(): readonly CoreConstitutionArticle[] {
  return CORE_CONSTITUTION_CATALOG;
}

export function buildConstitutionComplianceReport(
  workspaceId: string,
  companyId: string,
): ConstitutionComplianceReport {
  return auditConstitutionCompliance(workspaceId, companyId);
}

export function buildConstitutionDashboard(
  workspaceId: string,
  companyId: string,
): {
  catalog: CoreConstitutionArticle[];
  compliance: ConstitutionComplianceReport;
  summary: string;
  immutable: true;
  authority: "supreme_over_modules";
} {
  const compliance = buildConstitutionComplianceReport(workspaceId, companyId);
  return {
    catalog: listConstitutionArticles(),
    compliance,
    summary: constitutionExecutiveSummary(compliance),
    immutable: true,
    authority: "supreme_over_modules",
  };
}
