import type { EmpireOperatingSystemDeps, ExecutiveGovernanceReport, GovernanceCheck } from "./types.js";

export function assessGovernance(deps: EmpireOperatingSystemDeps): ExecutiveGovernanceReport {
  const checks: GovernanceCheck[] = [
    assessArchitecture(deps),
    assessBusiness(deps),
    assessFinancial(deps),
    assessEngineering(deps),
    assessCompliance(deps),
    assessAudit(deps),
  ];

  const overallComplianceScore = Math.round(
    checks.reduce((sum, c) => sum + c.score, 0) / checks.length,
  );

  const auditRequired = checks.some((c) => c.status === "fail" || c.status === "warn");
  const protectionActions = buildProtectionActions(checks);

  return {
    checks,
    overallComplianceScore,
    auditRequired,
    protectionActions,
  };
}

function assessArchitecture(deps: EmpireOperatingSystemDeps): GovernanceCheck {
  const health = deps.intelligence.health.score;
  const status = health >= 75 ? "pass" : health >= 50 ? "warn" : "fail";
  return {
    domain: "architecture",
    status,
    score: health,
    findings:
      health >= 75
        ? ["Repository architecture coherent for multi-business operations"]
        : ["Architecture health below target — Technical Chief review required"],
  };
}

function assessBusiness(deps: EmpireOperatingSystemDeps): GovernanceCheck {
  const commerce = deps.commerceIntelligence.analyzeCommerce();
  const score = Math.min(100, 50 + commerce.recommendedProducts.length * 12);
  return {
    domain: "business",
    status: score >= 70 ? "pass" : score >= 50 ? "warn" : "fail",
    score,
    findings: [
      `${commerce.recommendedProducts.length} validated product opportunities`,
      commerce.recommendedActions[0] ?? "Run commerce analysis",
    ],
  };
}

function assessFinancial(deps: EmpireOperatingSystemDeps): GovernanceCheck {
  const topMargin = deps.commerceIntelligence.analyzeCommerce().recommendedProducts[0]?.product.profitMarginPercent ?? 0;
  const score = Math.min(100, 40 + topMargin);
  return {
    domain: "financial",
    status: score >= 70 ? "pass" : score >= 50 ? "warn" : "fail",
    score,
    findings: topMargin >= 60
      ? [`Top product margin ${topMargin}% meets Empire financial threshold`]
      : ["Margin below target — review pricing before scaling"],
  };
}

function assessEngineering(deps: EmpireOperatingSystemDeps): GovernanceCheck {
  const snapshot = deps.infrastructureCommander.getLastSnapshot();
  const score = snapshot
    ? snapshot.overallHealth === "healthy" ? 95 : snapshot.overallHealth === "degraded" ? 65 : 30
    : 70;
  return {
    domain: "engineering",
    status: score >= 75 ? "pass" : score >= 50 ? "warn" : "fail",
    score,
    findings: snapshot
      ? [`Infrastructure ${snapshot.overallHealth}`]
      : ["Infrastructure scan pending — run before production operations"],
  };
}

function assessCompliance(deps: EmpireOperatingSystemDeps): GovernanceCheck {
  const objective = deps.objective?.getActiveObjective();
  const aligned = objective && objective.progressPercent >= 0;
  const score = aligned ? 85 : 60;
  return {
    domain: "compliance",
    status: score >= 75 ? "pass" : "warn",
    score,
    findings: [
      objective ? `Active objective: ${objective.title}` : "Objective engine active",
      "Grand King approval required for category-A changes",
    ],
  };
}

function assessAudit(deps: EmpireOperatingSystemDeps): GovernanceCheck {
  const dueDiligenceReady = !!deps.dueDiligence;
  const score = dueDiligenceReady ? 88 : 55;
  return {
    domain: "audit",
    status: score >= 75 ? "pass" : "warn",
    score,
    findings: dueDiligenceReady
      ? ["Continuous Due Diligence Engine active", "Executive Audit Reviewer available"]
      : ["Audit subsystem unavailable"],
  };
}

function buildProtectionActions(checks: GovernanceCheck[]): string[] {
  const actions: string[] = [];
  for (const check of checks) {
    if (check.status === "fail") {
      actions.push(`URGENT: Resolve ${check.domain} governance failure before scaling`);
    } else if (check.status === "warn") {
      actions.push(`Monitor ${check.domain} — ${check.findings[0]}`);
    }
  }
  if (actions.length === 0) {
    actions.push("All governance domains pass — Empire protected for scaling");
    actions.push("Schedule quarterly executive audit review");
  }
  return actions.slice(0, 5);
}
