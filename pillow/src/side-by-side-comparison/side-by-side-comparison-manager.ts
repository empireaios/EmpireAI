/** T4-05 — Side-by-Side Comparison Manager — core comparison pipeline. */

import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { SideBySideComparisonConfiguration } from "./configuration.js";
import type {
  ComparisonInput,
  ComparisonRunReport,
  ComparisonType,
  SideBySideComparisonRecord,
} from "./types.js";
import { ComparisonSessionManager } from "./comparison-session-manager.js";
import { ProposalComparisonEngine } from "./proposal-comparison-engine.js";
import { PreviewComparisonConnector } from "./preview-comparison-connector.js";
import { LayoutComparisonEngine } from "./layout-comparison-engine.js";
import { ComponentComparisonEngine } from "./component-comparison-engine.js";
import { NavigationComparisonEngine } from "./navigation-comparison-engine.js";
import { WorkflowComparisonEngine } from "./workflow-comparison-engine.js";
import { ThemeComparisonEngine } from "./theme-comparison-engine.js";
import { AccessibilityComparisonEngine } from "./accessibility-comparison-engine.js";
import { ConsistencyComparisonEngine } from "./consistency-comparison-engine.js";
import { DifferenceHighlightEngine } from "./difference-highlight-engine.js";
import { ScoreComparisonConnector } from "./score-comparison-connector.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import { ComparisonValidator } from "./comparison-validator.js";
import type { CategoryComparisonResult } from "./comparison-engine-shared.js";
import { appendComparisonLog } from "./comparison-logging.js";
import { COMPARISON_METADATA_VERSION } from "./paths.js";

export type SideBySideComparisonEngineBundle = {
  multiProposalGenerator: MultiProposalGeneratorEngine | null;
  previewGenerator: PreviewGenerator | null;
  validationEngine: ValidationEngine | null;
  uxScoring: UxScoringEngine | null;
  uiStateMapper: UiStateMapperEngine | null;
};

export class SideBySideComparisonManager {
  private readonly sessions = new ComparisonSessionManager();
  private readonly proposalEngine = new ProposalComparisonEngine();
  private readonly previewConnector = new PreviewComparisonConnector();
  private readonly layoutEngine = new LayoutComparisonEngine();
  private readonly componentEngine = new ComponentComparisonEngine();
  private readonly navigationEngine = new NavigationComparisonEngine();
  private readonly workflowEngine = new WorkflowComparisonEngine();
  private readonly themeEngine = new ThemeComparisonEngine();
  private readonly accessibilityEngine = new AccessibilityComparisonEngine();
  private readonly consistencyEngine = new ConsistencyComparisonEngine();
  private readonly highlightEngine = new DifferenceHighlightEngine();
  private readonly scoreConnector = new ScoreComparisonConnector();
  private readonly metadata = new ComparisonMetadataGenerator();
  private readonly validator = new ComparisonValidator();

  compare(input: {
    comparisonInput: ComparisonInput;
    config: SideBySideComparisonConfiguration;
    engines: SideBySideComparisonEngineBundle;
  }): ComparisonRunReport {
    const started = Date.now();
    appendComparisonLog({
      event: "side_by_side_comparison_start",
      level: "info",
      details: `Starting comparison type ${input.comparisonInput.comparisonType}`,
    });

    let session = this.sessions.startSession(input.comparisonInput.sessionId);
    session = this.sessions.trimHistory(session, input.config.maxHistoryComparisons);

    const { proposals, targetScreenId, targetRouteOrViewId } = this.proposalEngine.load({
      comparisonInput: input.comparisonInput,
      config: input.config,
      multiProposalGenerator: input.engines.multiProposalGenerator,
    });

    const includeOriginal =
      input.comparisonInput.includeOriginal ??
      input.comparisonInput.comparisonType === "original_vs_proposal";

    let uiScreenId: string | null = null;
    if (input.engines.uiStateMapper) {
      try {
        const latest = input.engines.uiStateMapper.getLatestState?.() ?? null;
        uiScreenId = latest?.screen.screenId ?? null;
      } catch {
        /* upstream optional */
      }
    }

    const { options, previewBuildIds } = this.previewConnector.buildOptions({
      proposals,
      includeOriginal,
      config: input.config,
      previewGenerator: input.engines.previewGenerator,
      uiStateMapperScreenId: uiScreenId ?? targetScreenId,
    });

    const categoryResults = this.runCategoryEngines(
      input.comparisonInput.comparisonType,
      proposals,
    );

    const highlight = this.highlightEngine.highlight({
      options,
      categoryResults,
      config: input.config,
    });

    const scores = this.scoreConnector.collect({
      config: input.config,
      uxScoring: input.engines.uxScoring,
      validationEngine: input.engines.validationEngine,
    });

    const avgConfidence =
      categoryResults.length > 0
        ? categoryResults.reduce((s, r) => s + r.confidence, 0) / categoryResults.length
        : 0.5;

    const comparison: SideBySideComparisonRecord = this.metadata.enrichComparison({
      comparisonId: this.metadata.buildComparisonId(),
      timestamp: new Date().toISOString(),
      sessionId: session.sessionId,
      comparisonType: input.comparisonInput.comparisonType,
      sourceProposalIds: proposals.map((p) => p.proposalId),
      sourcePreviewBuildIds: previewBuildIds,
      sourceUxScoreIds: scores.uxScoreIds,
      sourceValidationReportIds: scores.validationReportIds,
      targetScreenId,
      targetRouteOrViewId,
      comparedOptions: options,
      originalLayoutReference: includeOriginal
        ? options[0]?.layoutReference ?? null
        : null,
      proposedLayoutReferences: options
        .filter((o) => o.proposalId !== null)
        .map((o) => o.layoutReference ?? `proposal:${o.proposalId}`),
      differenceSummary: highlight.summary,
      visualDifferenceMarkers: highlight.markers,
      uxScoreDifferences: scores.uxScoreDifferences,
      accessibilityDifferences: scores.accessibilityDifferences,
      consistencyDifferences: scores.consistencyDifferences,
      workflowDifferences: scores.workflowDifferences,
      comparisonStatus: "validated",
      confidenceScore: Math.round(avgConfidence * 100) / 100,
      metadataVersion: COMPARISON_METADATA_VERSION,
    });

    session = this.sessions.appendComparison(session.sessionId, comparison, "completed");
    const validation = this.validator.validate(comparison, input.config, {
      appliedChanges: false,
      approvedChanges: false,
    });

    appendComparisonLog({
      event: "side_by_side_comparison_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Comparison ${validation.decision.toUpperCase()} · ${options.length} options`,
    });

    this.sessions.endSession(session.sessionId);

    return {
      comparisonRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      session: { ...session, status: "completed" },
      comparison,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: COMPARISON_METADATA_VERSION,
    };
  }

  private runCategoryEngines(
    comparisonType: ComparisonType,
    proposals: import("../multi-proposal-generator/types.js").RedesignProposalRecord[],
  ): CategoryComparisonResult[] {
    const results: CategoryComparisonResult[] = [];

    const runAll = () => {
      results.push(this.layoutEngine.compare(proposals));
      results.push(this.componentEngine.compare(proposals));
      results.push(this.navigationEngine.compare(proposals));
      results.push(this.workflowEngine.compare(proposals));
      results.push(this.themeEngine.compare(proposals));
      results.push(this.accessibilityEngine.compare(proposals));
      results.push(this.consistencyEngine.compare(proposals));
    };

    switch (comparisonType) {
      case "layout_comparison":
      case "responsive_layout_comparison":
        results.push(this.layoutEngine.compare(proposals));
        break;
      case "component_comparison":
        results.push(this.componentEngine.compare(proposals));
        break;
      case "navigation_comparison":
        results.push(this.navigationEngine.compare(proposals));
        break;
      case "workflow_comparison":
        results.push(this.workflowEngine.compare(proposals));
        break;
      case "theme_comparison":
        results.push(this.themeEngine.compare(proposals));
        break;
      case "accessibility_comparison":
        results.push(this.accessibilityEngine.compare(proposals));
        break;
      case "visual_consistency_comparison":
        results.push(this.consistencyEngine.compare(proposals));
        break;
      case "original_vs_proposal":
      case "proposal_vs_proposal":
      default:
        runAll();
        break;
    }

    return results;
  }

  getActiveSessionCount(): number {
    return this.sessions.getActiveSessionCount();
  }

  endSession(sessionId: string): void {
    this.sessions.endSession(sessionId);
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
  }
}
