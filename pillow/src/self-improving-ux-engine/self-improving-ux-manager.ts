/** T5-09 — Self-Improving UX Engine Manager — core learning pipeline. */

import type { WorkspaceIntelligenceRecord } from "../executive-workspace-intelligence-engine/types.js";
import type { UxEvolutionRecord } from "../continuous-ux-evolution-engine/types.js";
import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { ApprovalRecord } from "../approval-workflow/types.js";
import type { ChangeDocumentationRecord } from "../change-documentation/types.js";
import type { SelfImprovingUxConfiguration } from "./configuration.js";
import { appendLearningLog } from "./siux-logging.js";
import { ExperienceKnowledgeBase } from "./experience-knowledge-base.js";
import { LearningMetadataGenerator } from "./learning-metadata-generator.js";
import { LearningSessionManager } from "./learning-session-manager.js";
import { LearningValidator } from "./learning-validator.js";
import { UxLearningEngine } from "./ux-learning-engine.js";
import { UX_LEARNING_METADATA_VERSION } from "./paths.js";
import type {
  SelfImprovingUxEngineBundle,
  SelfImprovingUxInput,
  SelfImprovingUxRunReport,
  UxLearningRecord,
} from "./types.js";

export class SelfImprovingUxManager {
  private readonly sessions = new LearningSessionManager();
  private readonly learning = new UxLearningEngine();
  private readonly metadata = new LearningMetadataGenerator();
  private readonly validator = new LearningValidator();
  private readonly knowledgeBase = new ExperienceKnowledgeBase();
  private topLearnings: UxLearningRecord[] = [];

  learnUx(input: {
    learningInput: SelfImprovingUxInput;
    config: SelfImprovingUxConfiguration;
    engines: SelfImprovingUxEngineBundle;
  }): SelfImprovingUxRunReport {
    const started = Date.now();
    appendLearningLog({
      event: "ux_learning_start",
      level: "info",
      details: "Starting UX learning cycle",
    });

    const session =
      this.sessions.getActiveSession() ??
      this.sessions.startSession(input.learningInput.sessionId);

    const workspaceRecords = this.resolveWorkspaceRecords(input.engines, input.learningInput);
    const uxEvolutionRecords = this.resolveUxEvolutionRecords(input.engines);
    const evolutionRecords = this.resolveEvolutionRecords(input.engines);
    const productivityRecords = this.resolveProductivityRecords(input.engines);
    const approvals = this.resolveApprovals(input.engines);
    const changeRecords = this.resolveChangeRecords(input.engines);
    const audit = this.resolveAudit(input.engines);

    const candidates = this.learning.learn({
      workspaceRecords,
      uxEvolutionRecords,
      evolutionRecords,
      productivityRecords,
      approvals,
      changeRecords,
      audit,
      config: input.config,
    });

    const records = this.metadata.buildRecords({
      candidates,
      recordStatus: candidates.length > 0 ? "learned" : "validated",
    });

    this.topLearnings = [...records].sort((a, b) => b.confidenceScore - a.confidenceScore);
    const knowledgeEntries = this.knowledgeBase.update({
      candidates,
      maxEntries: input.config.maxKnowledgeBaseEntries,
    });

    const validation = input.config.validationRulesEnabled
      ? this.validator.validate(records, input.config)
      : {
          validationReportId: `siux-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass" as const,
          recordsValidated: records.length,
          errors: [],
          warnings: [],
          durationMs: 0,
          metadataVersion: UX_LEARNING_METADATA_VERSION,
        };

    const success = validation.decision !== "fail";
    this.sessions.recordLearning(success, records.length);

    appendLearningLog({
      event: "prioritization_improvement",
      level: success ? "info" : "warn",
      details: `Generated ${records.length} learning records · ${validation.decision}`,
    });

    const report: SelfImprovingUxRunReport = {
      learningRunReportId: `siux-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      records,
      knowledgeEntries,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: UX_LEARNING_METADATA_VERSION,
    };

    appendLearningLog({
      event: "ux_learning_end",
      level: "info",
      details: `Learning completed in ${report.durationMs}ms`,
    });

    return report;
  }

  getTopLearnings(): UxLearningRecord[] {
    return this.topLearnings;
  }

  getSessionManager(): LearningSessionManager {
    return this.sessions;
  }

  getKnowledgeBase(): ExperienceKnowledgeBase {
    return this.knowledgeBase;
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.knowledgeBase.resetForTesting();
    this.learning.resetForTesting();
    this.topLearnings = [];
  }

  private resolveWorkspaceRecords(
    engines: SelfImprovingUxEngineBundle,
    input: SelfImprovingUxInput,
  ): WorkspaceIntelligenceRecord[] {
    try {
      const ewi = engines.executiveWorkspaceIntelligence?.getState();
      if (input.workspaceIntelligenceId) {
        const match = (ewi?.topRecommendations ?? []).find(
          (r) => r.workspaceIntelligenceId === input.workspaceIntelligenceId,
        );
        if (match) return [match];
        const fromReport = (ewi?.latestReport?.records ?? []).find(
          (r) => r.workspaceIntelligenceId === input.workspaceIntelligenceId,
        );
        if (fromReport) return [fromReport];
      }
      if (ewi?.latestReport?.records?.length) return ewi.latestReport.records;
      if (ewi?.topRecommendations?.length) return ewi.topRecommendations;
      if (engines.executiveWorkspaceIntelligence && input.forceLearning) {
        return engines.executiveWorkspaceIntelligence.optimizeWorkspace({}).records;
      }
    } catch {
      appendLearningLog({
        event: "partial_t5_workspace",
        level: "warn",
        details: "Workspace intelligence unavailable for UX learning",
      });
    }
    return [];
  }

  private resolveUxEvolutionRecords(
    engines: SelfImprovingUxEngineBundle,
  ): UxEvolutionRecord[] {
    try {
      const cue = engines.continuousUxEvolution?.getState();
      if (cue?.latestReport?.records?.length) return cue.latestReport.records;
      if (cue?.topImprovements?.length) return cue.topImprovements;
    } catch {
      return [];
    }
    return [];
  }

  private resolveEvolutionRecords(
    engines: SelfImprovingUxEngineBundle,
  ): WorkflowEvolutionRecord[] {
    try {
      const wfe = engines.workflowEvolution?.getState();
      if (wfe?.latestReport?.records?.length) return wfe.latestReport.records;
      if (wfe?.topRecommendations?.length) return wfe.topRecommendations;
    } catch {
      return [];
    }
    return [];
  }

  private resolveProductivityRecords(
    engines: SelfImprovingUxEngineBundle,
  ): ProductivityIntelligenceRecord[] {
    try {
      const pie = engines.productivityIntelligence?.getState();
      if (pie?.latestReport?.records?.length) return pie.latestReport.records;
      if (pie?.topPatterns?.length) return pie.topPatterns;
    } catch {
      return [];
    }
    return [];
  }

  private resolveApprovals(engines: SelfImprovingUxEngineBundle): ApprovalRecord[] {
    try {
      const aw = engines.approvalWorkflow?.getState();
      if (aw?.latestReport?.approval) return [aw.latestReport.approval];
      return [];
    } catch {
      return [];
    }
  }

  private resolveChangeRecords(
    engines: SelfImprovingUxEngineBundle,
  ): ChangeDocumentationRecord[] {
    try {
      const cd = engines.changeDocumentation?.getState();
      if (cd?.latestReport?.records?.length) return cd.latestReport.records;
    } catch {
      return [];
    }
    return [];
  }

  private resolveAudit(engines: SelfImprovingUxEngineBundle): UxAuditRecord | null {
    try {
      const aua = engines.autonomousUxAudit?.getState();
      if (aua?.latestAudit) return aua.latestAudit;
      if (aua?.latestReport?.audit) return aua.latestReport.audit;
    } catch {
      return null;
    }
    return null;
  }
}
