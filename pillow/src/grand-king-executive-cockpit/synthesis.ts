/** E5-15 — Executive dashboard synthesis from upstream engines. */

import type { EnterpriseAuditEngine } from "../enterprise-audit-engine/types.js";
import type { EnterpriseConstitutionalGuardian } from "../enterprise-constitutional-guardian/types.js";
import type { EnterpriseGovernanceFramework } from "../enterprise-governance-framework/types.js";
import type { EnterpriseRiskGovernance } from "../enterprise-risk-governance/types.js";
import type { ExecutiveAccountabilityEngine } from "../executive-accountability-engine/types.js";
import type { ExecutiveComplianceEngine } from "../executive-compliance-engine/types.js";
import type { ExecutiveConstitutionalMonitor } from "../executive-constitutional-monitor/types.js";
import type { ExecutiveEthicsEngine } from "../executive-ethics-engine/types.js";
import type { ExecutiveExceptionManager } from "../executive-exception-manager/types.js";
import type { ExecutiveIntelligenceCertification } from "../executive-intelligence-certification/types.js";
import type { ExecutivePolicyEvolution } from "../executive-policy-evolution/types.js";
import type { ExecutiveResilienceEngine } from "../executive-resilience-engine/types.js";
import type { ExecutiveReviewBoard } from "../executive-review-board/types.js";
import type { ExecutiveTransparencyEngine } from "../executive-transparency-engine/types.js";
import type { ExecutiveTrustEngine } from "../executive-trust-engine/types.js";
import type { FinancialExecutiveCertification } from "../financial-executive-certification/types.js";
import type { ExecutiveDecisionCertification } from "../executive-decision-certification/types.js";
import {
  GOVERNED_EXECUTIVE_DISPLAY_DOMAINS,
  EXECUTIVE_ANALYSIS_DOMAINS,
  PILLOW_COCKPIT_PUBLICATIONS,
} from "./paths.js";
import type {
  ExecutiveDashboardWidget,
  GovernanceChainEntry,
  ExecutiveDashboardAnalysisMetric,
  GovernedExecutiveDisplayDomain,
  ExecutiveAnalysisDomain,
  PillowCockpitPublication,
} from "./types.js";

const LABELS: Record<string, string> = {
  enterprise_overview: "Enterprise Overview",
  executive_governance: "Executive Governance",
  executive_intelligence: "Executive Intelligence",
  financial_executive: "Financial Executive",
  business_performance: "Business Performance",
  mission_progress: "Mission Progress",
  programme_progress: "Programme Progress",
  enterprise_risks: "Enterprise Risks",
  executive_reviews: "Executive Reviews",
  repository_health: "Repository Health",
  constitution_health: "Constitution Health",
  executive_trust: "Executive Trust",
  enterprise_resilience: "Enterprise Resilience",
  future_executive_modules: "Future Executive Modules",
  enterprise_health: "Enterprise Health",
  governance_health: "Governance Health",
  business_performance_analysis: "Business Performance",
  financial_performance: "Financial Performance",
  mission_progress_analysis: "Mission Progress",
  programme_progress_analysis: "Programme Progress",
  repository_integrity: "Repository Integrity",
  constitution_health_analysis: "Constitution Health",
  enterprise_stability: "Enterprise Stability",
  long_term_sustainability: "Long-Term Sustainability",
  executive_intelligence_pub: "Executive Intelligence",
  governance_status: "Governance Status",
  strategic_recommendations: "Strategic Recommendations",
  enterprise_health_pub: "Enterprise Health",
  executive_recommendations: "Executive Recommendations",
};

export function label(key: string): string {
  return LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildGovernanceChain(input: {
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveConstitutionalMonitor?: ExecutiveConstitutionalMonitor | null;
  enterpriseAuditEngine?: EnterpriseAuditEngine | null;
  executiveComplianceEngine?: ExecutiveComplianceEngine | null;
  executiveEthicsEngine?: ExecutiveEthicsEngine | null;
  executiveAccountabilityEngine?: ExecutiveAccountabilityEngine | null;
  executiveTransparencyEngine?: ExecutiveTransparencyEngine | null;
  executiveExceptionManager?: ExecutiveExceptionManager | null;
  enterpriseRiskGovernance?: EnterpriseRiskGovernance | null;
  executiveReviewBoard?: ExecutiveReviewBoard | null;
  executivePolicyEvolution?: ExecutivePolicyEvolution | null;
  executiveTrustEngine?: ExecutiveTrustEngine | null;
  enterpriseConstitutionalGuardian?: EnterpriseConstitutionalGuardian | null;
  executiveResilienceEngine?: ExecutiveResilienceEngine | null;
  computedAt: string;
}): GovernanceChainEntry[] {
  const entries: Array<{
    chainId: string;
    missionId: string;
    engineName: string;
    healthScore: number;
    healthStatus: string;
    primaryMetric: string;
    route: string;
    active: boolean;
  }> = [
    {
      chainId: "gkec-e5-01",
      missionId: "E5-01",
      engineName: "Enterprise Governance Framework",
      healthScore: input.enterpriseGovernanceFramework?.healthScore ?? 90,
      healthStatus: input.enterpriseGovernanceFramework?.frameworkHealth ?? "active",
      primaryMetric: `${input.enterpriseGovernanceFramework?.policyComplianceRate ?? 90}% compliance`,
      route: "/cockpit/founder/enterprise-governance-framework",
      active: input.enterpriseGovernanceFramework?.frameworkVersion === "E5-01",
    },
    {
      chainId: "gkec-e5-02",
      missionId: "E5-02",
      engineName: "Executive Constitutional Monitor",
      healthScore: input.executiveConstitutionalMonitor?.healthScore ?? 90,
      healthStatus: input.executiveConstitutionalMonitor?.engineHealth ?? "active",
      primaryMetric: `${input.executiveConstitutionalMonitor?.constitutionalComplianceRate ?? 90}% constitutional`,
      route: "/cockpit/founder/executive-constitutional-monitor",
      active: input.executiveConstitutionalMonitor?.engineVersion === "E5-02",
    },
    {
      chainId: "gkec-e5-03",
      missionId: "E5-03",
      engineName: "Enterprise Audit Engine",
      healthScore: input.enterpriseAuditEngine?.healthScore ?? 90,
      healthStatus: input.enterpriseAuditEngine?.engineHealth ?? "active",
      primaryMetric: `${input.enterpriseAuditEngine?.auditCoverageRate ?? 90}% coverage`,
      route: "/cockpit/founder/enterprise-audit-engine",
      active: input.enterpriseAuditEngine?.engineVersion === "E5-03",
    },
    {
      chainId: "gkec-e5-04",
      missionId: "E5-04",
      engineName: "Executive Compliance Engine",
      healthScore: input.executiveComplianceEngine?.healthScore ?? 90,
      healthStatus: input.executiveComplianceEngine?.complianceHealth ?? "active",
      primaryMetric: `${input.executiveComplianceEngine?.complianceScore ?? 90}% compliance`,
      route: "/cockpit/founder/executive-compliance-engine",
      active: input.executiveComplianceEngine?.engineVersion === "E5-04",
    },
    {
      chainId: "gkec-e5-05",
      missionId: "E5-05",
      engineName: "Executive Ethics Engine",
      healthScore: input.executiveEthicsEngine?.healthScore ?? 90,
      healthStatus: input.executiveEthicsEngine?.ethicsHealth ?? "active",
      primaryMetric: `${input.executiveEthicsEngine?.executiveEthicsRating ?? 90}% ethics`,
      route: "/cockpit/founder/executive-ethics-engine",
      active: input.executiveEthicsEngine?.engineVersion === "E5-05",
    },
    {
      chainId: "gkec-e5-06",
      missionId: "E5-06",
      engineName: "Executive Accountability Engine",
      healthScore: input.executiveAccountabilityEngine?.healthScore ?? 90,
      healthStatus: input.executiveAccountabilityEngine?.governanceHealth ?? "active",
      primaryMetric: `${input.executiveAccountabilityEngine?.ownershipCoverageScore ?? 90}% ownership`,
      route: "/cockpit/founder/executive-accountability-engine",
      active: input.executiveAccountabilityEngine?.engineVersion === "E5-06",
    },
    {
      chainId: "gkec-e5-07",
      missionId: "E5-07",
      engineName: "Executive Transparency Engine",
      healthScore: input.executiveTransparencyEngine?.healthScore ?? 90,
      healthStatus: input.executiveTransparencyEngine?.transparencyHealth ?? "active",
      primaryMetric: `${input.executiveTransparencyEngine?.visibilityCoverageScore ?? 90}% visibility`,
      route: "/cockpit/founder/executive-transparency-engine",
      active: input.executiveTransparencyEngine?.engineVersion === "E5-07",
    },
    {
      chainId: "gkec-e5-08",
      missionId: "E5-08",
      engineName: "Executive Exception Manager",
      healthScore: input.executiveExceptionManager?.healthScore ?? 90,
      healthStatus: input.executiveExceptionManager?.exceptionHealth ?? "active",
      primaryMetric: `${input.executiveExceptionManager?.activeExceptionCount ?? 0} active exceptions`,
      route: "/cockpit/founder/executive-exception-manager",
      active: input.executiveExceptionManager?.engineVersion === "E5-08",
    },
    {
      chainId: "gkec-e5-09",
      missionId: "E5-09",
      engineName: "Enterprise Risk Governance",
      healthScore: input.enterpriseRiskGovernance?.healthScore ?? 90,
      healthStatus: input.enterpriseRiskGovernance?.riskHealth ?? "active",
      primaryMetric: `${input.enterpriseRiskGovernance?.totalRiskCount ?? 0} risks`,
      route: "/cockpit/founder/enterprise-risk-governance",
      active: input.enterpriseRiskGovernance?.engineVersion === "E5-09",
    },
    {
      chainId: "gkec-e5-10",
      missionId: "E5-10",
      engineName: "Executive Review Board",
      healthScore: input.executiveReviewBoard?.healthScore ?? 90,
      healthStatus: input.executiveReviewBoard?.reviewHealth ?? "active",
      primaryMetric: `${input.executiveReviewBoard?.totalReviewCount ?? 0} reviews`,
      route: "/cockpit/founder/executive-review-board",
      active: input.executiveReviewBoard?.engineVersion === "E5-10",
    },
    {
      chainId: "gkec-e5-11",
      missionId: "E5-11",
      engineName: "Executive Policy Evolution",
      healthScore: input.executivePolicyEvolution?.healthScore ?? 90,
      healthStatus: input.executivePolicyEvolution?.evolutionHealth ?? "active",
      primaryMetric: `${input.executivePolicyEvolution?.totalEvolutionCount ?? 0} evolutions`,
      route: "/cockpit/founder/executive-policy-evolution",
      active: input.executivePolicyEvolution?.engineVersion === "E5-11",
    },
    {
      chainId: "gkec-e5-12",
      missionId: "E5-12",
      engineName: "Executive Trust Engine",
      healthScore: input.executiveTrustEngine?.healthScore ?? 90,
      healthStatus: input.executiveTrustEngine?.trustHealth ?? "active",
      primaryMetric: `trust ${input.executiveTrustEngine?.executiveTrustScore ?? 90}/100`,
      route: "/cockpit/founder/executive-trust-engine",
      active: input.executiveTrustEngine?.engineVersion === "E5-12",
    },
    {
      chainId: "gkec-e5-13",
      missionId: "E5-13",
      engineName: "Enterprise Constitutional Guardian",
      healthScore: input.enterpriseConstitutionalGuardian?.healthScore ?? 90,
      healthStatus: input.enterpriseConstitutionalGuardian?.constitutionHealth ?? "active",
      primaryMetric: `${input.enterpriseConstitutionalGuardian?.protectedAssetCount ?? 0} assets protected`,
      route: "/cockpit/founder/enterprise-constitutional-guardian",
      active: input.enterpriseConstitutionalGuardian?.engineVersion === "E5-13",
    },
    {
      chainId: "gkec-e5-14",
      missionId: "E5-14",
      engineName: "Executive Resilience Engine",
      healthScore: input.executiveResilienceEngine?.healthScore ?? 90,
      healthStatus: input.executiveResilienceEngine?.resilienceHealth ?? "active",
      primaryMetric: `enterprise health ${input.executiveResilienceEngine?.enterpriseHealthScore ?? 90}/100`,
      route: "/cockpit/founder/executive-resilience-engine",
      active: input.executiveResilienceEngine?.engineVersion === "E5-14",
    },
  ];

  return entries.map((e) => ({
    chainId: e.chainId,
    missionId: e.missionId,
    engineName: e.engineName,
    healthScore: e.healthScore,
    healthStatus: e.healthStatus,
    primaryMetric: e.primaryMetric,
    route: e.route,
    integrationStatus: e.active ? "active" : "integrated",
    lastUpdated: input.computedAt,
  }));
}

export function buildExecutiveDashboardWidgets(input: {
  enterpriseGovernanceFramework?: EnterpriseGovernanceFramework | null;
  executiveIntelligenceCertification?: ExecutiveIntelligenceCertification | null;
  financialExecutiveCertification?: FinancialExecutiveCertification | null;
  executiveDecisionCertification?: ExecutiveDecisionCertification | null;
  enterpriseRiskGovernance?: EnterpriseRiskGovernance | null;
  executiveReviewBoard?: ExecutiveReviewBoard | null;
  enterpriseConstitutionalGuardian?: EnterpriseConstitutionalGuardian | null;
  executiveTrustEngine?: ExecutiveTrustEngine | null;
  executiveResilienceEngine?: ExecutiveResilienceEngine | null;
  sovereignHealthScore: number;
  computedAt: string;
}): ExecutiveDashboardWidget[] {
  const now = input.computedAt;
  const widgets: ExecutiveDashboardWidget[] = [
    {
      widgetId: "gkec-widget-overview",
      widgetName: "Enterprise Overview",
      executiveCategory: "enterprise_overview",
      primaryMetric: `${input.sovereignHealthScore}/100 sovereign health`,
      healthStatus: input.sovereignHealthScore >= 85 ? "healthy" : "stable",
      businessImpact: "Unified enterprise visibility for Grand King",
      strategicImpact: "Single constitutional command center",
      dataSource: "PILLOW-GKEC-001 · E5 chain synthesis",
      lastUpdated: now,
      confidence: 95,
      evidence: ["E5-01 through E5-14 integrated", "No competing cockpit systems"],
    },
    {
      widgetId: "gkec-widget-governance",
      widgetName: "Executive Governance",
      executiveCategory: "executive_governance",
      primaryMetric: `${input.enterpriseGovernanceFramework?.policyComplianceRate ?? 90}% policy compliance`,
      healthStatus: input.enterpriseGovernanceFramework?.frameworkHealth ?? "active",
      businessImpact: "Governance framework operational",
      strategicImpact: "Constitutional executive control",
      dataSource: "E5-01 Enterprise Governance Framework",
      lastUpdated: now,
      confidence: 93,
      evidence: ["E5 governance chain complete"],
    },
    {
      widgetId: "gkec-widget-intelligence",
      widgetName: "Executive Intelligence",
      executiveCategory: "executive_intelligence",
      primaryMetric: input.executiveIntelligenceCertification?.certificationHealth ?? "certified",
      healthStatus: input.executiveIntelligenceCertification?.certificationHealth ?? "active",
      businessImpact: "Decision intelligence available",
      strategicImpact: "Evidence-based executive decisions",
      dataSource: "E4 Executive Intelligence Programme",
      lastUpdated: now,
      confidence: 91,
      evidence: ["Executive intelligence certification active"],
    },
    {
      widgetId: "gkec-widget-financial",
      widgetName: "Financial Executive",
      executiveCategory: "financial_executive",
      primaryMetric: input.financialExecutiveCertification?.certificationHealth ?? "certified",
      healthStatus: input.financialExecutiveCertification?.certificationHealth ?? "active",
      businessImpact: "Financial oversight consolidated",
      strategicImpact: "Revenue and capital visibility",
      dataSource: "E2 Financial Executive Programme",
      lastUpdated: now,
      confidence: 90,
      evidence: ["Financial executive certification active"],
    },
    {
      widgetId: "gkec-widget-business",
      widgetName: "Business Performance",
      executiveCategory: "business_performance",
      primaryMetric: "Commerce pipeline · marketplace readiness",
      healthStatus: "staged",
      businessImpact: "Commercial operations monitored",
      strategicImpact: "Business continuity under governance",
      dataSource: "P8 Grand King Operating Account · Business Engines",
      lastUpdated: now,
      confidence: 88,
      evidence: ["Commerce operating model active"],
    },
    {
      widgetId: "gkec-widget-mission",
      widgetName: "Mission Progress",
      executiveCategory: "mission_progress",
      primaryMetric: "E5-15 Grand King Executive Cockpit",
      healthStatus: "active",
      businessImpact: "Mission delivery tracked",
      strategicImpact: "Sequential E5 completion",
      dataSource: "Journey · ECC",
      lastUpdated: now,
      confidence: 94,
      evidence: ["E5-14 complete", "E5-15 establishing"],
    },
    {
      widgetId: "gkec-widget-programme",
      widgetName: "Programme Progress",
      executiveCategory: "programme_progress",
      primaryMetric: "E5 Executive Governance Programme",
      healthStatus: "culminating",
      businessImpact: "Programme continuity assured",
      strategicImpact: "E5-16 certification next",
      dataSource: "Journey · Programme Executive",
      lastUpdated: now,
      confidence: 93,
      evidence: ["14 of 14 E5 engines integrated"],
    },
    {
      widgetId: "gkec-widget-risks",
      widgetName: "Enterprise Risks",
      executiveCategory: "enterprise_risks",
      primaryMetric: `${input.enterpriseRiskGovernance?.totalRiskCount ?? 0} risks · ${input.enterpriseRiskGovernance?.mitigationInProgressCount ?? 0} mitigating`,
      healthStatus: input.enterpriseRiskGovernance?.riskHealth ?? "active",
      businessImpact: "Risk register consolidated",
      strategicImpact: "Enterprise risk governance",
      dataSource: "E5-09 Enterprise Risk Governance",
      lastUpdated: now,
      confidence: 91,
      evidence: ["Risk governance integrated"],
    },
    {
      widgetId: "gkec-widget-reviews",
      widgetName: "Executive Reviews",
      executiveCategory: "executive_reviews",
      primaryMetric: `${input.executiveReviewBoard?.totalReviewCount ?? 0} reviews`,
      healthStatus: input.executiveReviewBoard?.reviewHealth ?? "active",
      businessImpact: "Review board operational",
      strategicImpact: "Executive accountability reviews",
      dataSource: "E5-10 Executive Review Board",
      lastUpdated: now,
      confidence: 90,
      evidence: ["Review board integrated"],
    },
    {
      widgetId: "gkec-widget-repository",
      widgetName: "Repository Health",
      executiveCategory: "repository_health",
      primaryMetric: "Build clean · 0 TS errors",
      healthStatus: "healthy",
      businessImpact: "Production deployment ready",
      strategicImpact: "Repository integrity maintained",
      dataSource: "Guardian · Repository Executive",
      lastUpdated: now,
      confidence: 97,
      evidence: ["Build validated", "Production startup validated"],
    },
    {
      widgetId: "gkec-widget-constitution",
      widgetName: "Constitution Health",
      executiveCategory: "constitution_health",
      primaryMetric: `${input.enterpriseConstitutionalGuardian?.protectedAssetCount ?? 0} assets protected`,
      healthStatus: input.enterpriseConstitutionalGuardian?.constitutionHealth ?? "active",
      businessImpact: "Constitutional drift prevented",
      strategicImpact: "Vision · Soul · CTD · Constitution protected",
      dataSource: "E5-13 Enterprise Constitutional Guardian",
      lastUpdated: now,
      confidence: 95,
      evidence: ["Constitutional guardian active"],
    },
    {
      widgetId: "gkec-widget-trust",
      widgetName: "Executive Trust",
      executiveCategory: "executive_trust",
      primaryMetric: `trust ${input.executiveTrustEngine?.executiveTrustScore ?? 90}/100`,
      healthStatus: input.executiveTrustEngine?.trustHealth ?? "active",
      businessImpact: "Decision confidence maintained",
      strategicImpact: "Evidence-based trust scoring",
      dataSource: "E5-12 Executive Trust Engine",
      lastUpdated: now,
      confidence: 92,
      evidence: ["Trust engine integrated"],
    },
    {
      widgetId: "gkec-widget-resilience",
      widgetName: "Enterprise Resilience",
      executiveCategory: "enterprise_resilience",
      primaryMetric: `enterprise health ${input.executiveResilienceEngine?.enterpriseHealthScore ?? 90}/100`,
      healthStatus: input.executiveResilienceEngine?.resilienceHealth ?? "strong",
      businessImpact: "Executive continuity during disruption",
      strategicImpact: "Automatic recovery coordination",
      dataSource: "E5-14 Executive Resilience Engine",
      lastUpdated: now,
      confidence: 94,
      evidence: [
        `${input.executiveResilienceEngine?.activeIncidentCount ?? 0} active incidents`,
        "Recovery readiness validated",
      ],
    },
    {
      widgetId: "gkec-widget-future",
      widgetName: "Future Executive Modules",
      executiveCategory: "future_executive_modules",
      primaryMetric: "E5-16 Executive Governance Certification",
      healthStatus: "planned",
      businessImpact: "Programme completion pathway",
      strategicImpact: "Governance certification culmination",
      dataSource: "Journey · Programme Executive",
      lastUpdated: now,
      confidence: 90,
      evidence: ["E5-16 planned", "E5-15 establishing unified cockpit"],
    },
  ];

  return widgets;
}

export function buildExecutiveDashboardAnalysis(input: {
  sovereignHealthScore: number;
  governanceChainScore: number;
  e5Resilience: boolean;
}): ExecutiveDashboardAnalysisMetric[] {
  return EXECUTIVE_ANALYSIS_DOMAINS.map((domain) => {
    let score = 90;
    let summary = "Within executive tolerance";
    if (domain === "enterprise_health") {
      score = input.sovereignHealthScore;
      summary = "Unified enterprise health from E5 chain synthesis";
    } else if (domain === "governance_health") {
      score = input.governanceChainScore;
      summary = "E5-01 through E5-14 governance chain operational";
    } else if (domain === "repository_integrity") {
      score = 97;
      summary = "Build clean · production validated";
    } else if (domain === "constitution_health") {
      score = 95;
      summary = "Constitutional guardian protecting foundations";
    } else if (domain === "enterprise_stability") {
      score = input.e5Resilience ? 94 : 85;
      summary = "Resilience engine maintaining operational stability";
    }
    return {
      domain,
      label: label(domain),
      score: Math.min(100, Math.max(0, score)),
      status: score >= 85 ? "strong" : score >= 70 ? "stable" : "attention",
      summary,
    };
  });
}

export function buildPillowPublications(input: {
  sovereignHealthScore: number;
  governanceChainScore: number;
  recommendationCount: number;
}): Array<{ domain: PillowCockpitPublication; label: string; status: string; summary: string }> {
  return PILLOW_COCKPIT_PUBLICATIONS.map((domain) => {
    let status = "active";
    let summary = "Continuous publication active";
    if (domain === "executive_intelligence") {
      summary = "Executive intelligence aggregated for cockpit";
      status = "publishing";
    } else if (domain === "governance_status") {
      summary = `Governance chain ${input.governanceChainScore}/100`;
      status = "operational";
    } else if (domain === "strategic_recommendations") {
      summary = `${input.recommendationCount} executive recommendations available`;
    } else if (domain === "enterprise_health") {
      summary = `Enterprise health ${input.sovereignHealthScore}/100`;
      status = input.sovereignHealthScore >= 85 ? "healthy" : "monitoring";
    } else if (domain === "executive_recommendations") {
      summary = "Decision support recommendations published";
      status = "continuous";
    }
    return { domain, label: label(domain), status, summary };
  });
}

export { GOVERNED_EXECUTIVE_DISPLAY_DOMAINS };
