/** T2-03 — Executive Style Learning manager. */

import { appendExecutiveStyleLog } from "./executive-style-logging.js";
import { ExecutivePreferenceValidator } from "./executive-preference-validator.js";
import { PreferenceConflictResolver } from "./preference-conflict-resolver.js";
import { PreferenceLearningEngine } from "./preference-learning-engine.js";
import { PreferenceModelBuilder } from "./preference-model-builder.js";
import { PreferenceVersionManager } from "./preference-version-manager.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { ExecutiveStyleLearningConfiguration } from "./configuration.js";
import type {
  ExecutiveStyleLearningReport,
  ExecutiveStyleModel,
  PreferenceLearningEvent,
  PreferenceRecord,
} from "./types.js";
import { PREFERENCE_METADATA_VERSION } from "./paths.js";

export class ExecutiveStyleLearningManager {
  private readonly learningEngine = new PreferenceLearningEngine();
  private readonly modelBuilder = new PreferenceModelBuilder();
  private readonly validator = new ExecutivePreferenceValidator();
  private readonly conflictResolver = new PreferenceConflictResolver();
  private readonly versionManager = new PreferenceVersionManager();
  private latestModel: ExecutiveStyleModel | null = null;
  private pendingEvents: PreferenceLearningEvent[] = [];

  queueEvent(event: PreferenceLearningEvent): void {
    this.pendingEvents.push(event);
  }

  recordApproval(
    event: Omit<PreferenceLearningEvent, "eventType">,
    config: ExecutiveStyleLearningConfiguration,
  ): PreferenceRecord | null {
    return this.learningEngine.recordEvent({ ...event, eventType: "approval" }, config);
  }

  recordRejection(
    event: Omit<PreferenceLearningEvent, "eventType">,
    config: ExecutiveStyleLearningConfiguration,
  ): PreferenceRecord | null {
    return this.learningEngine.recordEvent({ ...event, eventType: "rejection" }, config);
  }

  private config!: ExecutiveStyleLearningConfiguration;

  setConfiguration(config: ExecutiveStyleLearningConfiguration): void {
    this.config = config;
  }

  runLearning(designSystem: DesignSystemModel | null): ExecutiveStyleLearningReport {
    const started = Date.now();
    let approvalsProcessed = 0;
    let rejectionsProcessed = 0;
    let preferencesUpdated = 0;

    appendExecutiveStyleLog({
      event: "executive_style_learning_start",
      level: "info",
      details: `Processing ${this.pendingEvents.length} pending learning events`,
    });

    for (const event of this.pendingEvents) {
      const result = this.learningEngine.recordEvent(event, this.config);
      if (result) {
        preferencesUpdated += 1;
        if (event.eventType === "approval") approvalsProcessed += 1;
        else rejectionsProcessed += 1;
      }
    }
    this.pendingEvents = [];

    const rawPreferences = this.learningEngine.getPreferences();
    const { resolved, conflictsResolved } = this.config.conflictResolutionEnabled
      ? this.conflictResolver.resolve(rawPreferences)
      : { resolved: rawPreferences, conflictsResolved: 0 };

    const activeCount = resolved.filter((p) => p.currentStatus === "active").length;
    const modelChanged =
      preferencesUpdated > 0 || (activeCount > 0 && this.latestModel === null);
    const version = this.versionManager.bumpIfChanged(
      modelChanged,
      this.config.versioningEnabled,
    );
    const model = this.modelBuilder.build({
      preferences: resolved,
      designSystem,
      modelVersion: version,
    });
    this.latestModel = model;

    const validation = this.validator.validate(model, resolved, this.config.validationRulesEnabled);

    const report: ExecutiveStyleLearningReport = {
      learningReportId: `esl-learning-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      learningTimestamp: new Date().toISOString(),
      model,
      preferences: resolved,
      validation,
      approvalsProcessed,
      rejectionsProcessed,
      preferencesUpdated,
      durationMs: Date.now() - started,
      metadataVersion: PREFERENCE_METADATA_VERSION,
    };

    appendExecutiveStyleLog({
      event: "executive_style_learning_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Learning ${validation.decision.toUpperCase()} · ${resolved.length} preferences · confidence ${model.confidenceScore} · ${report.durationMs}ms`,
    });

    return report;
  }

  getLatestModel(): ExecutiveStyleModel | null {
    return this.latestModel;
  }

  getPreferences(): PreferenceRecord[] {
    return this.learningEngine.getPreferences();
  }

  reset(): void {
    this.learningEngine.reset();
    this.versionManager.reset();
    this.latestModel = null;
    this.pendingEvents = [];
  }
}
