import { ELE_METADATA_VERSION } from "./paths.js";
import type { EmpireLegacyInput, HistoricalSignificance } from "./types.js";

const SIGNIFICANCE_RANK: Record<HistoricalSignificance, number> = {
  routine: 1,
  notable: 2,
  major: 3,
  foundational: 4,
};

export class HistoricalArchiveEngine {
  resolveCategory(action: string, input: EmpireLegacyInput): string {
    return input.legacyCategory?.trim() || action.replaceAll("_", " ");
  }
  eventReference(input: EmpireLegacyInput, category: string): string {
    return input.historicalEventReference?.trim() || `event-${category.replaceAll(" ", "-")}`;
  }
}

export class EnterpriseTimelineEngine {
  chronologicalStamp(): string {
    return new Date().toISOString();
  }
}

export class AchievementRegistryEngine {
  achievementReference(input: EmpireLegacyInput, category: string): string {
    return input.achievementReference?.trim() || (category.includes("achievement") ? `achievement-${Date.now()}` : "none");
  }
}

export class HistoricalIntelligenceEngine {
  significance(input: EmpireLegacyInput): HistoricalSignificance {
    if (input.historicalSignificance) return input.historicalSignificance;
    if (input.missingHistoryHint === true) return "major";
    return "notable";
  }
  significanceRank(value: HistoricalSignificance): number {
    return SIGNIFICANCE_RANK[value];
  }
}

export class LegacyRecommendationEngine {
  summarize(input: EmpireLegacyInput, company: string, category: string): string {
    return input.recommendationSummary?.trim() || `Review historical intelligence for ${company} (${category})`;
  }
}

export class LegacyMetadataGenerator {
  version() {
    return ELE_METADATA_VERSION;
  }
  traceId(index: number) {
    return `ele-trace-${Date.now()}-${index}`;
  }
}

export class LegacyValidator {
  decide(input: EmpireLegacyInput): "pass" | "partial" | "fail" {
    if (input.attemptModifyValidatedHistory === true && input.authorizedToModifyValidatedHistory !== true) return "fail";
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
