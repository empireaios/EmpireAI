import type { RegisteredWorker, WorkforceOrchestratorConfiguration } from "./configuration.js";
import type { WorkforceOrchestratorInput, WorkerDescriptor } from "./types.js";

const CATEGORY_KEYWORDS: Record<string, RegExp> = {
  strategy: /strateg|intent|priorit|option/i,
  product: /product|roadmap|experience|require/i,
  engineering: /engineer|build|implement|integrat|technical/i,
  operations: /operat|process|handoff|runtime|monitor/i,
  finance: /financ|budget|cost|margin|value/i,
  compliance: /complian|policy|govern|regulat/i,
  legal: /legal|contract|terms/i,
  marketing: /market|campaign|message|channel/i,
  sales: /sales|pipeline|deal|revenue.?captur/i,
  customer_success: /customer|retention|support|success/i,
  data_intelligence: /data|metric|insight|signal|analy/i,
  security: /secur|threat|control|vulnerab/i,
  talent: /talent|hire|workforce.?capabilit/i,
  executive_governance: /escalat|approval|executive|governance/i,
};

/** Discovers abstract workers without exposing location or implementation. */
export class WorkerDiscovery {
  discover(
    input: WorkforceOrchestratorInput,
    configuration: WorkforceOrchestratorConfiguration,
  ): WorkerDescriptor[] {
    const haystack = [
      input.executiveRequest,
      ...(input.categoryHints ?? []),
      ...(input.capabilityHints ?? []),
      ...(input.dependencyHints ?? []),
      ...(input.handoffHints ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return configuration.registeredWorkers
      .filter((worker) => worker.initialState !== "offline")
      .map((worker) => this.toDescriptor(worker, haystack, input))
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }

  private toDescriptor(
    worker: RegisteredWorker,
    haystack: string,
    input: WorkforceOrchestratorInput,
  ): WorkerDescriptor {
    let score = 40;
    const categoryHintMatch = (input.categoryHints ?? []).some(
      (h) => h.toLowerCase().replace(/\s+/g, "_") === worker.category || h.toLowerCase().includes(worker.category),
    );
    if (categoryHintMatch) score += 30;

    const categoryPattern = CATEGORY_KEYWORDS[worker.category];
    if (categoryPattern?.test(haystack)) score += 18;

    for (const capability of worker.capabilities) {
      if (haystack.includes(capability.replace(/_/g, " ")) || haystack.includes(capability)) score += 8;
      if ((input.capabilityHints ?? []).some((h) => h.toLowerCase().includes(capability) || capability.includes(h.toLowerCase().replace(/\s+/g, "_")))) {
        score += 12;
      }
    }

    if (worker.initialState === "available") score += 5;
    if (worker.initialState === "busy" || worker.initialState === "blocked") score -= 15;

    return {
      workerId: worker.workerId,
      category: worker.category,
      capabilities: [...worker.capabilities],
      state: worker.initialState,
      suitabilityScore: Math.max(0, Math.min(100, score)),
    };
  }
}
