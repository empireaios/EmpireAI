import type { BusinessManagementEvaluation, EmpireCompany, EmpireScalingPlan, ResourceAllocation } from "./types.js";
import { EMPIRE_PORTFOLIO } from "./company-catalog.js";

export function planEmpireScaling(
  companies: EmpireCompany[] = EMPIRE_PORTFOLIO,
  evaluations: BusinessManagementEvaluation[],
): EmpireScalingPlan {
  const evalById = new Map(evaluations.map((e) => [e.companyId, e]));
  const operating = companies.filter((c) => c.status === "operating" || c.status === "scaling");
  const launching = companies.filter((c) => c.status === "launching");

  const portfolioHealthScore =
    evaluations.length > 0
      ? Math.round(
          evaluations.reduce((sum, e) => sum + e.overallHealthScore, 0) / evaluations.length,
        )
      : 50;

  const resourceAllocations = buildResourceAllocations(companies, evaluations);
  const scalingPriorities = buildScalingPriorities(companies, evalById);
  const conflictResolutions = buildConflictResolutions(operating, launching);

  return {
    activeCompanies: companies.length,
    portfolioHealthScore,
    resourceAllocations,
    scalingPriorities,
    conflictResolutions,
  };
}

function buildResourceAllocations(
  companies: EmpireCompany[],
  evaluations: BusinessManagementEvaluation[],
): ResourceAllocation[] {
  const topEval = [...evaluations].sort((a, b) => b.overallHealthScore - a.overallHealthScore)[0];
  const hasOperating = companies.some((c) => c.status === "operating");

  return [
    {
      domain: "engineering",
      allocationPercent: hasOperating ? 35 : 50,
      rationale: hasOperating
        ? "Maintain storefront + automation infrastructure for live companies"
        : "Prioritise Storefront Engine deployment for launch pipeline",
    },
    {
      domain: "marketing",
      allocationPercent: topEval && topEval.overallHealthScore >= 75 ? 30 : 20,
      rationale: "Scale ad spend on highest-health company first",
    },
    {
      domain: "commerce",
      allocationPercent: 25,
      rationale: "Commerce Intelligence + supplier monitoring across portfolio",
    },
    {
      domain: "capital",
      allocationPercent: 15,
      rationale: "Reserve for test ad spend and supplier prepayments",
    },
    {
      domain: "technology",
      allocationPercent: 15,
      rationale: "Platform integrity, CRIR certification, live API integrations",
    },
  ];
}

function buildScalingPriorities(
  companies: EmpireCompany[],
  evalById: Map<string, BusinessManagementEvaluation>,
): string[] {
  const priorities: string[] = [];

  const ranked = [...companies].sort((a, b) => {
    const ea = evalById.get(a.id)?.overallHealthScore ?? 0;
    const eb = evalById.get(b.id)?.overallHealthScore ?? 0;
    return eb - ea;
  });

  for (const company of ranked.slice(0, 3)) {
    const eval_ = evalById.get(company.id);
    priorities.push(
      `${company.name} (${company.status}) — health ${eval_?.overallHealthScore ?? "n/a"}/100`,
    );
  }

  priorities.push("Allocate engineering to companies with pending storefront deployment");
  priorities.push("Cross-sell catalogue expansion only after first company proves unit economics");

  return priorities;
}

function buildConflictResolutions(
  operating: EmpireCompany[],
  launching: EmpireCompany[],
): string[] {
  const conflicts: string[] = [];

  if (operating.length > 0 && launching.length > 0) {
    conflicts.push(
      "Operating companies take engineering priority over launching — schedule launch storefront after operating stability",
    );
  }

  if (operating.length >= 2) {
    conflicts.push(
      "Multiple operating companies — marketing budget split 60/40 favouring highest health score",
    );
  }

  if (conflicts.length === 0) {
    conflicts.push("No portfolio conflicts — single-track launch recommended");
  }

  return conflicts;
}
