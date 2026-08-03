import { CKE_METADATA_VERSION } from "./paths.js";
import type { BusinessImpact, CivilizationKnowledgeInput } from "./types.js";

export class ExternalKnowledgeAcquisitionEngine {
  resolveCategory(action: string, input: CivilizationKnowledgeInput): string {
    return input.knowledgeCategory?.trim() || action.replaceAll("_", " ");
  }
}

export class IndustryIntelligenceEngine {
  relevanceScore(input: CivilizationKnowledgeInput): number {
    return Math.max(0, Math.min(100, input.strategicRelevanceScore ?? (input.emergingHint === true ? 80 : 50)));
  }
}

export class TechnologyIntelligenceEngine {
  impact(input: CivilizationKnowledgeInput, score: number): BusinessImpact {
    if (input.businessImpact) return input.businessImpact;
    if (score >= 85) return "transformational";
    if (score >= 70) return "significant";
    if (score >= 45) return "material";
    return "limited";
  }
}

export class StrategicKnowledgeAnalysisEngine {
  analyze(input: CivilizationKnowledgeInput, score: number): { emerging: boolean; relevance: number } {
    return { emerging: input.emergingHint === true || score >= 70, relevance: score };
  }
}

export class KnowledgeRecommendationEngine {
  summarize(input: CivilizationKnowledgeInput, domain: string, category: string): string {
    return input.recommendationSummary?.trim() || `Review strategic civilization knowledge for ${category} from ${domain}`;
  }
}

export class KnowledgeMetadataGenerator {
  version() {
    return CKE_METADATA_VERSION;
  }
  traceId(index: number) {
    return `cke-trace-${Date.now()}-${index}`;
  }
}

export class KnowledgeValidator {
  decide(input: CivilizationKnowledgeInput): "pass" | "partial" | "fail" {
    if (input.integrateIntoDecisionMakingAutomatically === true && input.validated !== true) return "fail";
    if (input.validated === true) return "pass";
    return "partial";
  }
}

export class HealthMonitor {
  health(enabled: boolean) {
    return enabled ? ("healthy" as const) : ("failed" as const);
  }
}

export class RecoveryManager {
  readonly automaticRecoveryEnabled = true as const;
  private attempts = 0;
  attempt() {
    this.attempts += 1;
    return { recovered: true as const, attempt: this.attempts };
  }
  getAttempts() {
    return this.attempts;
  }
}
