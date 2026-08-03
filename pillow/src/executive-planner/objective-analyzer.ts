import type { ExecutivePlannerInput, WorkforceCategory } from "./types.js";
import { WORKFORCE_CATEGORIES } from "./paths.js";

export type ObjectiveAnalysis = {
  objectiveSummary: string;
  intent: string;
  assumptions: string[];
  constraints: string[];
  priorities: string[];
  risks: string[];
  dependencies: string[];
  approvalNeeds: string[];
  successCriteria: string[];
  workforceCategories: WorkforceCategory[];
};

const CATEGORY_KEYWORDS: Record<WorkforceCategory, string[]> = {
  strategy: ["strategy", "strategic", "roadmap", "vision", "market entry"],
  product: ["product", "feature", "roadmap item", "ux", "user experience"],
  engineering: ["build", "implement", "software", "code", "platform", "api", "system", "technical"],
  operations: ["operate", "operations", "process", "workflow", "delivery", "scale operations"],
  finance: ["budget", "capital", "cost", "revenue", "finance", "investment", "funding"],
  compliance: ["compliance", "regulatory", "policy", "audit", "gdpr", "sox"],
  legal: ["legal", "contract", "terms", "ip ", "intellectual property", "license"],
  marketing: ["marketing", "brand", "campaign", "awareness", "content"],
  sales: ["sales", "pipeline", "customer acquisition", "quota"],
  customer_success: ["customer success", "support", "retention", "onboarding"],
  data_intelligence: ["data", "analytics", "intelligence", "insight", "metrics", "kpi"],
  security: ["security", "threat", "vulnerability", "access control", "encryption"],
  talent: ["hire", "talent", "recruit", "workforce", "staffing", "people"],
  executive_governance: ["governance", "board", "executive", "approval", "constitutional", "grand king"],
};

function unique(items: string[]): string[] {
  return [...new Set(items.map((s) => s.trim()).filter(Boolean))];
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

/** Structural objective analysis — no LLM, no tool invocation. */
export class ObjectiveAnalyzer {
  analyze(input: ExecutivePlannerInput): ObjectiveAnalysis {
    const raw = input.objective.trim();
    const text = raw.toLowerCase();
    const summary = raw.length > 220 ? `${raw.slice(0, 217)}...` : raw;

    const intent = this.extractIntent(raw, text);
    const constraints = unique([
      ...(input.constraintHints ?? []),
      ...this.matchLines(text, [
        ["deadline", "Constraint: delivery timeline must be respected"],
        ["budget", "Constraint: budget envelope must not be exceeded"],
        ["compliance", "Constraint: regulatory compliance is mandatory"],
        ["constitutional", "Constraint: constitutional governance must be preserved"],
        ["security", "Constraint: security controls must remain intact"],
        ["quality", "Constraint: operational quality must not be reduced"],
      ]),
      "Constraint: planner must not execute work or assign workers (Q0-01)",
    ]);

    const priorities = unique([
      input.priorityHint ? `Priority: ${input.priorityHint}` : "Priority: medium (default)",
      ...this.matchLines(text, [
        ["critical", "Priority: critical path items first"],
        ["urgent", "Priority: urgent delivery"],
        ["governance", "Priority: governance integrity before expansion"],
        ["revenue", "Priority: revenue impact"],
        ["customer", "Priority: customer outcomes"],
      ]),
    ]);

    const risks = unique([
      ...(input.riskHints ?? []),
      ...this.matchLines(text, [
        ["risk", "Risk: stated objective risks require mitigation planning"],
        ["scale", "Risk: scaling may stress operations and governance"],
        ["global", "Risk: cross-region complexity may increase compliance burden"],
        ["autonomous", "Risk: autonomy without approval gates may violate governance"],
        ["capital", "Risk: capital misallocation without staged validation"],
      ]),
      "Risk: incomplete success criteria may allow premature workforce assignment",
    ]);

    const assumptions = unique([
      ...(input.assumptionHints ?? []),
      "Assumption: objective text is authoritative for this planning cycle",
      "Assumption: future Q0 missions will consume this plan before assigning workers",
      ...(includesAny(text, ["existing", "current", "portfolio"])
        ? ["Assumption: existing portfolio context remains available to downstream orchestration"]
        : ["Assumption: required enterprise context will be supplied by later orchestration stages"]),
    ]);

    const dependencies = unique([
      ...(input.dependencyHints ?? []),
      ...this.matchLines(text, [
        ["data", "Dependency: data readiness before analysis stages"],
        ["approval", "Dependency: executive approval before execution stages"],
        ["capital", "Dependency: capital allocation readiness"],
        ["compliance", "Dependency: compliance review gate"],
        ["integration", "Dependency: cross-programme integration readiness"],
      ]),
      "Dependency: validated execution plan before AI Workforce assignment",
    ]);

    const approvalNeeds = unique([
      ...(input.approvalHints ?? []),
      "Approval: executive acceptance of structured execution plan",
      ...this.matchLines(text, [
        ["budget", "Approval: finance authority for budget-impacting work"],
        ["legal", "Approval: legal review before contractual commitments"],
        ["compliance", "Approval: compliance gate before regulated operations"],
        ["global", "Approval: regional governance for cross-border work"],
        ["hire", "Approval: talent authority before hiring actions"],
      ]),
    ]);

    const successCriteria = unique([
      ...(input.successCriteriaHints ?? []),
      "Success: machine-readable execution plan produced with plan ID and metadata version",
      "Success: workforce categories identified without assigning workers",
      "Success: risks, assumptions, constraints, dependencies, approvals, and criteria captured",
      ...this.matchLines(text, [
        ["launch", "Success: launch readiness criteria defined for downstream stages"],
        ["revenue", "Success: measurable revenue outcome criteria defined"],
        ["compliance", "Success: compliance evidence criteria defined"],
        ["scale", "Success: scaling readiness criteria defined"],
      ]),
    ]);

    const workforceCategories = this.identifyCategories(text, input);

    return {
      objectiveSummary: summary,
      intent,
      assumptions,
      constraints,
      priorities,
      risks,
      dependencies,
      approvalNeeds,
      successCriteria,
      workforceCategories,
    };
  }

  private extractIntent(raw: string, text: string): string {
    if (includesAny(text, ["expand", "global", "enter market"])) {
      return `Intent: expand enterprise reach — ${raw.slice(0, 120)}`;
    }
    if (includesAny(text, ["build", "create", "launch", "implement"])) {
      return `Intent: create or implement capability — ${raw.slice(0, 120)}`;
    }
    if (includesAny(text, ["optimize", "improve", "scale", "grow"])) {
      return `Intent: improve or scale existing capability — ${raw.slice(0, 120)}`;
    }
    if (includesAny(text, ["govern", "compliance", "audit", "certif"])) {
      return `Intent: strengthen governance or compliance posture — ${raw.slice(0, 120)}`;
    }
    return `Intent: achieve stated executive objective — ${raw.slice(0, 120)}`;
  }

  private matchLines(text: string, rules: Array<[string, string]>): string[] {
    return rules.filter(([keyword]) => text.includes(keyword)).map(([, line]) => line);
  }

  private identifyCategories(text: string, input: ExecutivePlannerInput): WorkforceCategory[] {
    const found: WorkforceCategory[] = [];
    for (const category of WORKFORCE_CATEGORIES) {
      if (includesAny(text, CATEGORY_KEYWORDS[category])) found.push(category);
    }
    if (!found.includes("executive_governance")) found.unshift("executive_governance");
    if (!found.includes("strategy")) found.unshift("strategy");
    if (input.priorityHint === "critical" && !found.includes("operations")) found.push("operations");
    return unique(found) as WorkforceCategory[];
  }
}
