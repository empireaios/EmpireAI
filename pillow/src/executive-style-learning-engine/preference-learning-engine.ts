/** T2-03 — Core preference learning engine. */

import { appendExecutiveStyleLog } from "./executive-style-logging.js";
import { ApprovalAnalyzer } from "./approval-analyzer.js";
import { RejectionAnalyzer } from "./rejection-analyzer.js";
import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";
import type { ExecutiveStyleLearningConfiguration } from "./configuration.js";
import type { PreferenceLearningEvent, PreferenceRecord } from "./types.js";

export class PreferenceLearningEngine {
  private readonly approvalAnalyzer = new ApprovalAnalyzer();
  private readonly rejectionAnalyzer = new RejectionAnalyzer();
  private readonly metadata = new PreferenceMetadataGenerator();
  private readonly preferences = new Map<string, PreferenceRecord>();
  private readonly processedEvents = new Set<string>();

  recordEvent(
    event: PreferenceLearningEvent,
    config: ExecutiveStyleLearningConfiguration,
  ): PreferenceRecord | null {
    if (config.deduplicateEvents && this.processedEvents.has(event.eventId)) {
      return null;
    }

    const analysis =
      event.eventType === "approval"
        ? this.approvalAnalyzer.analyze(event, config)
        : this.rejectionAnalyzer.analyze(event, config);

    if (!analysis.valid) {
      appendExecutiveStyleLog({
        event: event.eventType === "approval" ? "approval_learning_skipped" : "rejection_learning_skipped",
        level: "warn",
        details: analysis.reason ?? "Invalid learning event",
      });
      return null;
    }

    const key = `${event.category}:${event.value}`;
    const existing = this.preferences.get(key);
    const now = new Date().toISOString();
    const confidence = Math.max(
      0,
      Math.min(1, (existing?.learningConfidence ?? 0.5) + analysis.confidenceDelta),
    );

    const record: PreferenceRecord = this.metadata.enrichPreference({
      preferenceId: existing?.preferenceId ?? this.metadata.buildPreferenceId(event.category, event.value),
      preferenceCategory: event.category,
      preferenceDescription: event.description,
      preferenceValue: event.value,
      sourceReference: `${event.eventType}-${event.referenceId}`,
      learningConfidence: confidence,
      firstObservedTimestamp: existing?.firstObservedTimestamp ?? now,
      lastUpdatedTimestamp: now,
      currentStatus: confidence >= config.confidenceThreshold ? "active" : "deprecated",
      version: existing?.version ?? "1.0.0",
      metadataVersion: "1.0.0",
    });

    this.preferences.set(key, record);
    this.processedEvents.add(event.eventId);

    appendExecutiveStyleLog({
      event: event.eventType === "approval" ? "approval_learning" : "rejection_learning",
      level: "info",
      details: `${event.category}: ${event.value} (confidence ${confidence.toFixed(2)})`,
    });

    return record;
  }

  getPreferences(): PreferenceRecord[] {
    return [...this.preferences.values()];
  }

  getActivePreferences(): PreferenceRecord[] {
    return this.getPreferences().filter((p) => p.currentStatus === "active");
  }

  reset(): void {
    this.preferences.clear();
    this.processedEvents.clear();
  }
}
