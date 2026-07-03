/**
 * G5-08 — EKLS outcome plugin registry (providers, enrichers, analysers, exporters).
 */

import type { AutomationLearningRecord } from "../contracts/ekls-outcome-types.js";
import type { AutomationRun } from "../contracts/orchestrator-types.js";

export type KnowledgeProviderPlugin = {
  pluginId: string;
  provide: (input: { run: AutomationRun; outcome: AutomationLearningRecord["outcome"] }) => {
    lessonsLearned?: string[];
    operationalInsights?: string[];
    confidence?: number;
  };
};

export type EvidenceEnricherPlugin = {
  pluginId: string;
  enrich: (input: {
    run: AutomationRun;
    evidence: Record<string, unknown>;
  }) => Record<string, unknown>;
};

export type OutcomeAnalyserPlugin = {
  pluginId: string;
  analyse: (input: { run: AutomationRun; outcome: AutomationLearningRecord["outcome"] }) => {
    failureSummary?: string;
    recoverySummary?: string;
    lessonsLearned?: string[];
  };
};

export type LearningEnricherPlugin = {
  pluginId: string;
  enrich: (record: AutomationLearningRecord) => AutomationLearningRecord;
};

export type KnowledgeExporterPlugin = {
  pluginId: string;
  exportRecord: (record: AutomationLearningRecord) => Promise<{ exported: boolean; target?: string }>;
};

export class OutcomePluginRegistry {
  private readonly knowledgeProviders = new Map<string, KnowledgeProviderPlugin>();
  private readonly evidenceEnrichers = new Map<string, EvidenceEnricherPlugin>();
  private readonly outcomeAnalysers = new Map<string, OutcomeAnalyserPlugin>();
  private readonly learningEnrichers = new Map<string, LearningEnricherPlugin>();
  private readonly knowledgeExporters = new Map<string, KnowledgeExporterPlugin>();

  registerKnowledgeProvider(plugin: KnowledgeProviderPlugin): void {
    this.knowledgeProviders.set(plugin.pluginId, plugin);
  }

  registerEvidenceEnricher(plugin: EvidenceEnricherPlugin): void {
    this.evidenceEnrichers.set(plugin.pluginId, plugin);
  }

  registerOutcomeAnalyser(plugin: OutcomeAnalyserPlugin): void {
    this.outcomeAnalysers.set(plugin.pluginId, plugin);
  }

  registerLearningEnricher(plugin: LearningEnricherPlugin): void {
    this.learningEnrichers.set(plugin.pluginId, plugin);
  }

  registerKnowledgeExporter(plugin: KnowledgeExporterPlugin): void {
    this.knowledgeExporters.set(plugin.pluginId, plugin);
  }

  applyKnowledgeProviders(
    run: AutomationRun,
    outcome: AutomationLearningRecord["outcome"],
  ): { lessonsLearned: string[]; operationalInsights: string[]; confidence: number } {
    const lessonsLearned: string[] = [];
    const operationalInsights: string[] = [];
    let confidence = 0.7;

    for (const plugin of this.knowledgeProviders.values()) {
      const result = plugin.provide({ run, outcome });
      if (result.lessonsLearned) lessonsLearned.push(...result.lessonsLearned);
      if (result.operationalInsights) operationalInsights.push(...result.operationalInsights);
      if (typeof result.confidence === "number") confidence = result.confidence;
    }

    return { lessonsLearned, operationalInsights, confidence };
  }

  applyEvidenceEnrichers(
    run: AutomationRun,
    evidence: Record<string, unknown>,
  ): Record<string, unknown> {
    let enriched = { ...evidence };
    for (const plugin of this.evidenceEnrichers.values()) {
      enriched = plugin.enrich({ run, evidence: enriched });
    }
    return enriched;
  }

  applyOutcomeAnalysers(
    run: AutomationRun,
    outcome: AutomationLearningRecord["outcome"],
  ): { failureSummary?: string; recoverySummary?: string; lessonsLearned: string[] } {
    const lessonsLearned: string[] = [];
    let failureSummary: string | undefined;
    let recoverySummary: string | undefined;

    for (const plugin of this.outcomeAnalysers.values()) {
      const result = plugin.analyse({ run, outcome });
      if (result.failureSummary) failureSummary = result.failureSummary;
      if (result.recoverySummary) recoverySummary = result.recoverySummary;
      if (result.lessonsLearned) lessonsLearned.push(...result.lessonsLearned);
    }

    return { failureSummary, recoverySummary, lessonsLearned };
  }

  applyLearningEnrichers(record: AutomationLearningRecord): AutomationLearningRecord {
    let enriched = record;
    for (const plugin of this.learningEnrichers.values()) {
      enriched = plugin.enrich(enriched);
    }
    return enriched;
  }

  resetForTests(): void {
    this.knowledgeProviders.clear();
    this.evidenceEnrichers.clear();
    this.outcomeAnalysers.clear();
    this.learningEnrichers.clear();
    this.knowledgeExporters.clear();
  }

  removePlugin(pluginId: string): void {
    this.knowledgeProviders.delete(pluginId);
    this.evidenceEnrichers.delete(pluginId);
    this.outcomeAnalysers.delete(pluginId);
    this.learningEnrichers.delete(pluginId);
    this.knowledgeExporters.delete(pluginId);
  }
}

export const outcomePluginRegistry = new OutcomePluginRegistry();

export function resetOutcomePluginRegistryForTests(): void {
  outcomePluginRegistry.resetForTests();
}
