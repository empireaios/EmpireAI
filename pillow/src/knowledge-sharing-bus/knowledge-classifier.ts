import type { KnowledgeSharingBusConfiguration } from "./configuration.js";
import { KNOWLEDGE_CATEGORIES } from "./paths.js";
import type { KnowledgeCategory, KnowledgeSharingBusInput } from "./types.js";

export type ClassificationBundle = {
  category: KnowledgeCategory | string;
  title: string;
  summary: string;
  confidenceScore: number;
  classificationLabels: string[];
  evidence: string[];
  playbooks: string[];
  version: string;
};

/** Pure knowledge classification/categorization helpers for Q0-23. */
export class KnowledgeClassifier {
  classify(
    input: KnowledgeSharingBusInput,
    config: KnowledgeSharingBusConfiguration,
  ): ClassificationBundle {
    const category = this.categorize(input, config);
    const title =
      input.knowledgeTitle?.trim() ||
      `Shared ${category.replace(/_/g, " ")} from ${input.sourceWorker?.trim() || "worker"}`;
    const summary =
      input.knowledgeSummary?.trim() ||
      `Organizational knowledge asset classified as ${category.replace(/_/g, " ")}.`;
    const confidenceScore =
      input.confidenceScore != null && Number.isFinite(input.confidenceScore)
        ? Math.max(0, Math.min(100, input.confidenceScore))
        : 70;
    const classificationLabels = unique([
      ...(input.classificationHints ?? []),
      `category:${category}`,
      `source:${input.sourceWorker?.trim() || "worker-unspecified"}`,
      confidenceScore >= 80 ? "high_confidence" : confidenceScore >= 50 ? "medium_confidence" : "low_confidence",
      ...(input.relatedPlaybooks ?? []).map((p) => `playbook:${p}`),
    ]);
    const version = normalizeVersion(input.version) ?? "1.0.0";
    return {
      category,
      title,
      summary,
      confidenceScore,
      classificationLabels,
      evidence: unique(input.supportingEvidence ?? []),
      playbooks: unique(input.relatedPlaybooks ?? []),
      version,
    };
  }

  categorize(
    input: KnowledgeSharingBusInput,
    config: KnowledgeSharingBusConfiguration,
  ): KnowledgeCategory | string {
    const explicit = input.knowledgeCategory?.toString().trim();
    if (explicit) {
      const allowed = new Set(config.knowledgeCategories);
      if (allowed.has(explicit) || (KNOWLEDGE_CATEGORIES as readonly string[]).includes(explicit)) {
        return explicit;
      }
      return explicit;
    }

    const text = [
      input.knowledgeTitle ?? "",
      input.knowledgeSummary ?? "",
      ...(input.supportingEvidence ?? []),
      ...(input.classificationHints ?? []),
    ]
      .join(" ")
      .toLowerCase();

    if (/(recover|incident|outage|rollback)/.test(text)) return "recovery_knowledge";
    if (/(lesson|postmortem|learned)/.test(text)) return "lessons_learned";
    if (/(best practice|standard|playbook)/.test(text)) return "best_practice";
    if (/(market|competitor|demand)/.test(text)) return "market_intelligence";
    if (/(customer|churn|nps|retention)/.test(text)) return "customer_intelligence";
    if (/(finance|budget|margin|cash)/.test(text)) return "financial_knowledge";
    if (/(executive|board|strategy)/.test(text)) return "executive_knowledge";
    if (/(api|code|infra|deploy|technical)/.test(text)) return "technical_knowledge";
    if (/(ops|operational|workflow|sla)/.test(text)) return "operational_knowledge";
    return "business_knowledge";
  }

  nextVersion(current: string): string {
    const parts = current.split(".").map((p) => Number.parseInt(p, 10));
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      return `${parts[0]}.${parts[1]}.${parts[2]! + 1}`;
    }
    return `${current}.1`;
  }
}

function normalizeVersion(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value.trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
