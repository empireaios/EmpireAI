import { useCallback, useEffect, useState } from "react";
import {
  fetchExecutiveCommand,
  fetchCommerceRuntimeDashboard,
  fetchGlobalCommerceDashboard,
  fetchGlobalCommerceIntelligenceDashboard,
  fetchEmpireKnowledgeDashboard,
  fetchGlobalCommerceInfrastructureDashboard,
  fetchFounderAutomationDashboard,
  fetchRealityReadinessDashboard,
  fetchOperationalAccessRegistry,
  fetchOperationalAccessDashboard,
  fetchSupplierIntelligenceDashboard,
  fetchGlobalCommerceExecutionDashboard,
  fetchGlobalMarketplaceOperationsDashboard,
  fetchGlobalAdvertisingIntelligenceDashboard,
  fetchGlobalExpansionScoreDashboard,
  fetchGlobalCommandCenterDashboard,
  fetchGrandKingFinancialCommandCenterDashboard,
  fetchGlobalOperationalCommandCenterDashboard,
  fetchVersion1ReadinessAudit,
  fetchVersion1Lockdown,
  fetchLiveCommerceFoundationDashboard,
  fetchAmazonGlobalSellerDashboard,
  fetchCommerceIntelligenceStudioDashboard,
  fetchExecutiveCouncilHeadquarters,
  fetchExecutiveVisualDebateDashboard,
  fetchSoulDecisionChamberDashboard,
  fetchKingDecisionHistoryDashboard,
  fetchVersion1ExecutiveSignOffDashboard,
  fetchExecutiveSurveillanceHeadquarters,
  fetchGrandKingAccountDashboard,
  fetchGrandKingRevenuePipelineHeadquarters,
  fetchEsisDashboard,
  fetchMasterCompletionLedger,
  fetchGlobalOpportunityBoard,
  fetchVersion1CompletionPackage,
  fetchEyeSeriesDashboard,
  fetchGrandKingsDashboard,
  fetchLatestDailyBrief,
  fetchOperationFirstDollarDashboard,
  fetchSuccess001CommandCenterDashboard,
} from "@/api/dashboard";

export interface EmpireDashboardData {
  dashboard: Record<string, unknown> | null;
  ofd: Record<string, unknown> | null;
  brief: Record<string, unknown> | null;
  eyes: Record<string, unknown> | null;
  executive: Record<string, unknown> | null;
  esis: Record<string, unknown> | null;
  commerceRuntime: Record<string, unknown> | null;
  globalCommerce: Record<string, unknown> | null;
  globalCommerceIntelligence: Record<string, unknown> | null;
  empireKnowledge: Record<string, unknown> | null;
  globalCommerceInfrastructure: Record<string, unknown> | null;
  founderAutomation: Record<string, unknown> | null;
  realityReadiness: Record<string, unknown> | null;
  operationalAccess: Record<string, unknown> | null;
  operationalAccessDashboard: Record<string, unknown> | null;
  supplierIntelligence: Record<string, unknown> | null;
  globalCommerceExecution: Record<string, unknown> | null;
  globalMarketplaceOperations: Record<string, unknown> | null;
  globalAdvertisingIntelligence: Record<string, unknown> | null;
  globalExpansionScore: Record<string, unknown> | null;
  globalCommandCenter: Record<string, unknown> | null;
  globalOperationalCommandCenter: Record<string, unknown> | null;
  grandKingFinancialCommandCenter: Record<string, unknown> | null;
  version1Readiness: Record<string, unknown> | null;
  version1Lockdown: Record<string, unknown> | null;
  liveCommerceFoundation: Record<string, unknown> | null;
  amazonGlobalSeller: Record<string, unknown> | null;
  commerceIntelligenceStudio: Record<string, unknown> | null;
  executiveCouncil: Record<string, unknown> | null;
  executiveVisualDebate: Record<string, unknown> | null;
  soulDecisionChamber: Record<string, unknown> | null;
  kingDecisionHistory: Record<string, unknown> | null;
  version1SignOff: Record<string, unknown> | null;
  executiveSurveillance: Record<string, unknown> | null;
  grandKingAccount: Record<string, unknown> | null;
  grandKingRevenuePipeline: Record<string, unknown> | null;
  masterCompletionLedger: Record<string, unknown> | null;
  globalOpportunityBoard: Record<string, unknown> | null;
  version1Completion: Record<string, unknown> | null;
  success001: Record<string, unknown> | null;
}

export function useEmpireDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EmpireDashboardData>({
    dashboard: null,
    ofd: null,
    brief: null,
    eyes: null,
    executive: null,
    esis: null,
    commerceRuntime: null,
    globalCommerce: null,
    globalCommerceIntelligence: null,
    empireKnowledge: null,
    globalCommerceInfrastructure: null,
    founderAutomation: null,
    realityReadiness: null,
    operationalAccess: null,
    operationalAccessDashboard: null,
    supplierIntelligence: null,
    globalCommerceExecution: null,
    globalMarketplaceOperations: null,
    globalAdvertisingIntelligence: null,
    globalExpansionScore: null,
    globalCommandCenter: null,
    globalOperationalCommandCenter: null,
    grandKingFinancialCommandCenter: null,
    version1Readiness: null,
    version1Lockdown: null,
    liveCommerceFoundation: null,
    amazonGlobalSeller: null,
    commerceIntelligenceStudio: null,
    executiveCouncil: null,
    executiveVisualDebate: null,
    soulDecisionChamber: null,
    kingDecisionHistory: null,
    version1SignOff: null,
    executiveSurveillance: null,
    grandKingAccount: null,
    grandKingRevenuePipeline: null,
    masterCompletionLedger: null,
    globalOpportunityBoard: null,
    version1Completion: null,
    success001: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, ofdRes, briefRes, eyesRes, execRes, esisRes, crtRes, gcRes, gciRes, ekRes, gciInfraRes, faRes, rrRes, oaRes, oarRes, supRes, gceRes, gmoRes, gaiRes, gesRes, gccRes, gocRes, gkfcRes, v1rRes, v1lRes, lcRes, agsRes, cisRes, ecRes, evdRes, sdcRes, kdhRes, v1soRes, essRes, gkRes, gkrRes, mclRes, gobRes, v1cRes, s1Res] = await Promise.all([
        fetchGrandKingsDashboard(),
        fetchOperationFirstDollarDashboard(),
        fetchLatestDailyBrief(),
        fetchEyeSeriesDashboard(),
        fetchExecutiveCommand(),
        fetchEsisDashboard().catch(() => null),
        fetchCommerceRuntimeDashboard().catch(() => null),
        fetchGlobalCommerceDashboard().catch(() => null),
        fetchGlobalCommerceIntelligenceDashboard().catch(() => null),
        fetchEmpireKnowledgeDashboard().catch(() => null),
        fetchGlobalCommerceInfrastructureDashboard().catch(() => null),
        fetchFounderAutomationDashboard().catch(() => null),
        fetchRealityReadinessDashboard().catch(() => null),
        fetchOperationalAccessRegistry().catch(() => null),
        fetchOperationalAccessDashboard().catch(() => null),
        fetchSupplierIntelligenceDashboard().catch(() => null),
        fetchGlobalCommerceExecutionDashboard().catch(() => null),
        fetchGlobalMarketplaceOperationsDashboard().catch(() => null),
        fetchGlobalAdvertisingIntelligenceDashboard().catch(() => null),
        fetchGlobalExpansionScoreDashboard().catch(() => null),
        fetchGlobalCommandCenterDashboard().catch(() => null),
        fetchGlobalOperationalCommandCenterDashboard().catch(() => null),
        fetchGrandKingFinancialCommandCenterDashboard().catch(() => null),
        fetchVersion1ReadinessAudit().catch(() => null),
        fetchVersion1Lockdown().catch(() => null),
        fetchLiveCommerceFoundationDashboard().catch(() => null),
        fetchAmazonGlobalSellerDashboard().catch(() => null),
        fetchCommerceIntelligenceStudioDashboard().catch(() => null),
        fetchExecutiveCouncilHeadquarters().catch(() => null),
        fetchExecutiveVisualDebateDashboard().catch(() => null),
        fetchSoulDecisionChamberDashboard().catch(() => null),
        fetchKingDecisionHistoryDashboard().catch(() => null),
        fetchVersion1ExecutiveSignOffDashboard().catch(() => null),
        fetchExecutiveSurveillanceHeadquarters().catch(() => null),
        fetchGrandKingAccountDashboard().catch(() => null),
        fetchGrandKingRevenuePipelineHeadquarters().catch(() => null),
        fetchMasterCompletionLedger().catch(() => null),
        fetchGlobalOpportunityBoard().catch(() => null),
        fetchVersion1CompletionPackage().catch(() => null),
        fetchSuccess001CommandCenterDashboard().catch(() => null),
      ]);
      setData({
        dashboard: dashRes.dashboard,
        ofd: ofdRes,
        brief: briefRes?.brief ?? null,
        eyes: eyesRes,
        executive: execRes,
        esis: esisRes?.dashboard ?? null,
        commerceRuntime: crtRes?.dashboard ?? null,
        globalCommerce: gcRes?.dashboard ?? null,
        globalCommerceIntelligence: gciRes?.dashboard ?? null,
        empireKnowledge: ekRes?.dashboard ?? null,
        globalCommerceInfrastructure: gciInfraRes?.dashboard ?? null,
        founderAutomation: faRes?.dashboard ?? null,
        realityReadiness: rrRes?.dashboard ?? null,
        operationalAccess: oaRes?.registry ?? null,
        operationalAccessDashboard: oarRes?.dashboard ?? null,
        supplierIntelligence: supRes?.dashboard ?? null,
        globalCommerceExecution: gceRes?.dashboard ?? null,
        globalMarketplaceOperations: gmoRes?.dashboard ?? null,
        globalAdvertisingIntelligence: gaiRes?.dashboard ?? null,
        globalExpansionScore: gesRes?.dashboard ?? null,
        globalCommandCenter: gccRes?.dashboard ?? null,
        globalOperationalCommandCenter: gocRes?.dashboard ?? null,
        grandKingFinancialCommandCenter: gkfcRes?.dashboard ?? null,
        version1Readiness: v1rRes?.dashboard ?? null,
        version1Lockdown: v1lRes?.lockdown ?? null,
        liveCommerceFoundation: lcRes?.dashboard ?? null,
        amazonGlobalSeller: agsRes?.dashboard ?? null,
        commerceIntelligenceStudio: cisRes?.dashboard ?? null,
        executiveCouncil: ecRes?.dashboard ?? null,
        executiveVisualDebate: evdRes?.debate ?? null,
        soulDecisionChamber: sdcRes?.dashboard ?? null,
        kingDecisionHistory: kdhRes?.dashboard ?? null,
        version1SignOff: v1soRes?.dashboard ?? null,
        executiveSurveillance: essRes?.dashboard ?? null,
        grandKingAccount: gkRes?.dashboard ?? null,
        grandKingRevenuePipeline: gkrRes?.dashboard ?? null,
        masterCompletionLedger: mclRes?.ledger ?? null,
        globalOpportunityBoard: gobRes?.dashboard ?? null,
        version1Completion: v1cRes?.dashboard ?? null,
        success001: s1Res?.dashboard ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load empire data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...data, loading, error, reload: load };
}
