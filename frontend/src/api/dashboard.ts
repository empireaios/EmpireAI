import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { apiRequest } from "@/api/client";

export async function fetchGrandKingsDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/ecommerce-os/dashboard", {
    params: { companyId },
  });
}

export async function fetchOperationFirstDollarDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<Record<string, unknown>>("/operation-first-dollar/dashboard", {
    params: { companyId },
  });
}

export async function fetchLatestDailyBrief(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ brief: Record<string, unknown> }>("/operation-first-dollar/daily-brief/latest", {
    params: { companyId },
  }).catch(() => null);
}

export async function generateDailyBrief(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ brief: Record<string, unknown> }>("/operation-first-dollar/daily-brief", {
    method: "POST",
    body: { companyId },
  });
}

export async function fetchEyeSeriesDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<Record<string, unknown>>("/eye-series/dashboard", {
    params: { companyId },
  });
}

export async function fetchExecutiveCommand(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<Record<string, unknown>>("/execution-layer/executive-command", {
    params: { companyId },
  });
}

export async function fetchCommerceRuntimeDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/commerce-runtime/dashboard", {
    params: { companyId },
  });
}

export async function fetchGlobalCommerceDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/global-commerce/dashboard", {
    params: { companyId },
  });
}

export async function fetchGlobalCommerceIntelligenceDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/global-commerce-intelligence/dashboard", {
    params: { companyId },
  });
}

export async function fetchEmpireKnowledgeDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/empire-knowledge/dashboard", {
    params: { companyId },
  });
}

export async function fetchGlobalCommerceInfrastructureDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/global-commerce-infrastructure/dashboard", {
    params: { companyId },
  });
}

export async function fetchFounderAutomationDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/founder-automation/dashboard", {
    params: { companyId },
  });
}

export async function fetchRealityReadinessDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/reality-integration/readiness", {
    params: { companyId },
  });
}

export async function fetchOperationalAccessRegistry() {
  return apiRequest<{ registry: Record<string, unknown> }>("/reality-integration/operational-access");
}

export async function fetchOperationalAccessDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/operational-access/dashboard", {
    params: { companyId },
  });
}

export async function fetchSupplierIntelligenceDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/supplier-intelligence/dashboard", {
    params: { companyId },
  });
}

export async function fetchGlobalCommerceExecutionDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/global-commerce-execution/dashboard", {
    params: { companyId },
  });
}

export async function fetchGlobalMarketplaceOperationsDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/global-marketplace-operations/dashboard", {
    params: { companyId },
  });
}

export async function fetchGlobalAdvertisingIntelligenceDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/global-advertising-intelligence/dashboard", {
    params: { companyId },
  });
}

export async function fetchGlobalExpansionScoreDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/global-expansion-score/dashboard", {
    params: { companyId },
  });
}

export async function fetchGlobalCommandCenterDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/global-command-center/dashboard", {
    params: { companyId },
  });
}

export async function fetchGrandKingFinancialCommandCenterDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/grand-king-financial-command-center/dashboard", {
    params: { companyId },
  });
}

export async function fetchVersion1ReadinessAudit(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/version-1-readiness-audit/dashboard", {
    params: { companyId },
  });
}

export async function fetchVersion1Lockdown(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ lockdown: Record<string, unknown> }>("/version-1-lockdown/baseline", {
    params: { companyId },
  });
}

export async function fetchSuccess001CommandCenterDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/success-001-command-center/dashboard", {
    params: { companyId },
  });
}

export async function fetchGlobalOperationalCommandCenterDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/global-operational-command-center/dashboard", {
    params: { companyId },
  });
}

export async function fetchLiveCommerceFoundationDashboard() {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/reality-integration/live-commerce");
}

export async function fetchAmazonGlobalSellerDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/amazon-global-seller/dashboard", {
    params: { companyId },
  });
}

export async function fetchCommerceIntelligenceStudioDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/commerce-intelligence-studio/dashboard", {
    params: { companyId },
  });
}

export async function fetchExecutiveCouncilHeadquarters(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/executive-council/headquarters", {
    params: { companyId },
  });
}

export async function fetchExecutiveVisualDebateDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ debate: Record<string, unknown> }>("/executive-visual-debate/dashboard", {
    params: { companyId },
  });
}

export async function fetchSoulDecisionChamberDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/soul-decision-chamber/dashboard", {
    params: { companyId },
  });
}

export async function fetchKingDecisionHistoryDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/king-decision-history/dashboard", {
    params: { companyId },
  });
}

export async function fetchVersion1ExecutiveSignOffDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/version-1-executive-sign-off/dashboard", {
    params: { companyId },
  });
}

export async function fetchGrandKingAccountDashboard() {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/grand-king/dashboard");
}

export async function fetchGrandKingRevenuePipelineDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/grand-king-revenue-pipeline/dashboard", {
    params: { companyId },
  });
}

export async function fetchGrandKingRevenuePipelineHeadquarters(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/grand-king-revenue-pipeline/headquarters", {
    params: { companyId },
  });
}

export async function fetchExecutiveSurveillanceHeadquarters(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/executive-surveillance/headquarters", {
    params: { companyId },
  });
}

export async function fetchEsisDashboard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/empire-self-inspection/dashboard", {
    params: { companyId },
  });
}

export async function fetchMasterCompletionLedger(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ ledger: Record<string, unknown> }>("/master-completion-ledger/dashboard", {
    params: { companyId },
  });
}

export async function fetchGlobalOpportunityBoard(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/global-opportunity-board/dashboard", {
    params: { companyId },
  });
}

export async function fetchVersion1CompletionPackage(companyId = GRAND_KING_COMPANY_ID) {
  return apiRequest<{ dashboard: Record<string, unknown> }>("/version-1-completion/dashboard", {
    params: { companyId },
  });
}
