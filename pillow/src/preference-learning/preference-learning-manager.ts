/** T4-08 — Preference Learning Manager — core learning pipeline. */

import type { ApprovalWorkflowEngine } from "../approval-workflow/engine.js";
import type { ExplainDecisionsEngine } from "../explain-decisions/engine.js";
import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { VoiceUxCommandsEngine } from "../voice-ux-commands/engine.js";
import type { ScreenAnnotationEngine } from "../screen-annotation/engine.js";
import type { SideBySideComparisonEngine } from "../side-by-side-comparison/engine.js";
import type { PreferenceLearningConfiguration } from "./configuration.js";
import type { PreferenceLearningInput, PreferenceLearningRunReport } from "./types.js";
import { PreferenceLearningSessionManager } from "./preference-learning-session-manager.js";
import { ApprovalLearningEngine } from "./approval-learning-engine.js";
import { ConversationLearningEngine } from "./conversation-learning-engine.js";
import { ProposalPreferenceAnalyzer } from "./proposal-preference-analyzer.js";
import { ExplanationPreferenceAnalyzer } from "./explanation-preference-analyzer.js";
import { CollaborationPatternAnalyzer } from "./collaboration-pattern-analyzer.js";
import { CollaborationPreferenceEngine } from "./collaboration-preference-engine.js";
import { PreferenceVersionManager } from "./preference-version-manager.js";
import { PreferenceMetadataGenerator } from "./preference-metadata-generator.js";
import { PreferenceValidator } from "./preference-validator.js";
import { appendPreferenceLog } from "./preference-logging.js";
import { PREFERENCE_METADATA_VERSION } from "./paths.js";

export type PreferenceLearningEngineBundle = {
  approvalWorkflow: ApprovalWorkflowEngine | null;
  explainDecisions: ExplainDecisionsEngine | null;
  multiProposalGenerator: MultiProposalGeneratorEngine | null;
  naturalUxConversation: NaturalUxConversationEngine | null;
  voiceUxCommands: VoiceUxCommandsEngine | null;
  screenAnnotation: ScreenAnnotationEngine | null;
  sideBySideComparison: SideBySideComparisonEngine | null;
};

export class PreferenceLearningManager {
  private readonly sessions = new PreferenceLearningSessionManager();
  private readonly approvalLearning = new ApprovalLearningEngine();
  private readonly conversationLearning = new ConversationLearningEngine();
  private readonly proposalAnalyzer = new ProposalPreferenceAnalyzer();
  private readonly explanationAnalyzer = new ExplanationPreferenceAnalyzer();
  private readonly patternAnalyzer = new CollaborationPatternAnalyzer();
  private readonly collaborationEngine = new CollaborationPreferenceEngine();
  private readonly versionManager = new PreferenceVersionManager();
  private readonly metadata = new PreferenceMetadataGenerator();
  private readonly validator = new PreferenceValidator();

  learn(input: {
    learningInput: PreferenceLearningInput;
    config: PreferenceLearningConfiguration;
    engines: PreferenceLearningEngineBundle;
  }): PreferenceLearningRunReport {
    const started = Date.now();
    appendPreferenceLog({
      event: "preference_learning_start",
      level: "info",
      details: "Starting collaboration preference learning",
    });

    const session = this.sessions.startSession(input.learningInput.sessionId);
    const version = this.versionManager.getCurrentVersion();
    const scope = input.learningInput.learningScope ?? input.config.learningScope;
    const scopedConfig = { ...input.config, learningScope: scope };

    const rawPreferences = [
      ...this.approvalLearning.learn({
        config: scopedConfig,
        approvalWorkflow: input.engines.approvalWorkflow,
        version,
      }),
      ...this.proposalAnalyzer.analyze({
        config: scopedConfig,
        multiProposalGenerator: input.engines.multiProposalGenerator,
        version,
      }),
      ...this.explanationAnalyzer.analyze({
        config: scopedConfig,
        explainDecisions: input.engines.explainDecisions,
        version,
      }),
      ...this.conversationLearning.learn({
        config: scopedConfig,
        naturalUxConversation: input.engines.naturalUxConversation,
        voiceUxCommands: input.engines.voiceUxCommands,
        version,
      }),
      ...this.patternAnalyzer.analyze({
        config: scopedConfig,
        sideBySideComparison: input.engines.sideBySideComparison,
        screenAnnotation: input.engines.screenAnnotation,
        version,
      }),
    ];

    const filtered = this.collaborationEngine.synthesize({
      preferences: rawPreferences,
      config: scopedConfig,
      requestedCategories: input.learningInput.categories,
    });

    const merged = this.versionManager.merge({
      newPreferences: filtered,
      config: scopedConfig,
    });

    const validation = this.validator.validate(merged.preferences, scopedConfig, {
      autoApproved: false,
      autoExecuted: false,
    });
    validation.preferencesUpdated = merged.updated;

    const updatedSession = this.sessions.appendPreferences(
      session.sessionId,
      filtered,
      "validated",
    );
    this.sessions.endSession(session.sessionId);

    appendPreferenceLog({
      event: "preference_learning_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Learned ${filtered.length} preferences · version ${merged.version}`,
    });

    return {
      preferenceLearningRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      session: { ...updatedSession, status: "completed" },
      preferences: merged.preferences,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PREFERENCE_METADATA_VERSION,
      preferenceVersion: merged.version,
    };
  }

  getLearnedPreferences() {
    return this.versionManager.getLearnedPreferences();
  }

  getCurrentPreferenceVersion(): string {
    return this.versionManager.getCurrentVersion();
  }

  getActiveSessionCount(): number {
    return this.sessions.getActiveSessionCount();
  }

  endSession(sessionId: string): void {
    this.sessions.endSession(sessionId);
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.versionManager.resetForTesting();
  }
}
