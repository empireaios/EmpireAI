/** T4-04 — Multi-Proposal Generator Manager — core generation pipeline. */

import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { VoiceUxCommandsEngine } from "../voice-ux-commands/engine.js";
import type { ScreenAnnotationEngine } from "../screen-annotation/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { MultiProposalGeneratorConfiguration } from "./configuration.js";
import type {
  ProposalCategory,
  ProposalGenerationInput,
  ProposalGenerationRunReport,
  RedesignProposalRecord,
} from "./types.js";
import { ProposalGenerationSessionManager } from "./proposal-generation-session-manager.js";
import { ProposalRequirementInterpreter } from "./proposal-requirement-interpreter.js";
import { ProposalStrategyEngine } from "./proposal-strategy-engine.js";
import { LayoutProposalGenerator } from "./layout-proposal-generator.js";
import { ComponentProposalGenerator } from "./component-proposal-generator.js";
import { NavigationProposalGenerator } from "./navigation-proposal-generator.js";
import { WorkflowProposalGenerator } from "./workflow-proposal-generator.js";
import { ThemeProposalGenerator } from "./theme-proposal-generator.js";
import { AccessibilityProposalGenerator } from "./accessibility-proposal-generator.js";
import { ConsistencyProposalGenerator } from "./consistency-proposal-generator.js";
import { ExtendedProposalGenerator } from "./extended-proposal-generator.js";
import { ProposalEvidenceLinker } from "./proposal-evidence-linker.js";
import { BuilderCapabilityMapper } from "./builder-capability-mapper.js";
import { ProposalMetadataGenerator } from "./proposal-metadata-generator.js";
import { ProposalValidator } from "./proposal-validator.js";
import { buildProposalRecord, type ProposalDraft } from "./proposal-generator-shared.js";
import { appendProposalLog } from "./proposal-logging.js";
import { PROPOSAL_METADATA_VERSION } from "./paths.js";

export type MultiProposalGeneratorEngineBundle = {
  naturalUxConversation: NaturalUxConversationEngine | null;
  voiceUxCommands: VoiceUxCommandsEngine | null;
  screenAnnotation: ScreenAnnotationEngine | null;
  uiStateMapper: UiStateMapperEngine | null;
  recommendationEngine: RecommendationEngine | null;
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null;
};

export class MultiProposalGeneratorManager {
  private readonly sessions = new ProposalGenerationSessionManager();
  private readonly interpreter = new ProposalRequirementInterpreter();
  private readonly strategy = new ProposalStrategyEngine();
  private readonly layoutGen = new LayoutProposalGenerator();
  private readonly componentGen = new ComponentProposalGenerator();
  private readonly navigationGen = new NavigationProposalGenerator();
  private readonly workflowGen = new WorkflowProposalGenerator();
  private readonly themeGen = new ThemeProposalGenerator();
  private readonly accessibilityGen = new AccessibilityProposalGenerator();
  private readonly consistencyGen = new ConsistencyProposalGenerator();
  private readonly extendedGen = new ExtendedProposalGenerator();
  private readonly evidenceLinker = new ProposalEvidenceLinker();
  private readonly capabilityMapper = new BuilderCapabilityMapper();
  private readonly metadata = new ProposalMetadataGenerator();
  private readonly validator = new ProposalValidator();

  generateProposals(input: {
    generationInput: ProposalGenerationInput;
    config: MultiProposalGeneratorConfiguration;
    engines: MultiProposalGeneratorEngineBundle;
  }): ProposalGenerationRunReport {
    const started = Date.now();
    appendProposalLog({
      event: "multi_proposal_generation_start",
      level: "info",
      details: "Starting multi-proposal generation",
    });

    let session = this.sessions.startSession(input.generationInput.sessionId);
    session = this.sessions.trimHistory(session, input.config.maxHistorySessions * 10);

    const requirements = this.interpreter.interpret({
      generationInput: input.generationInput,
      config: input.config,
      naturalUxConversation: input.engines.naturalUxConversation,
      voiceUxCommands: input.engines.voiceUxCommands,
      screenAnnotation: input.engines.screenAnnotation,
      uiStateMapper: input.engines.uiStateMapper,
    });

    const strategy = this.strategy.select(requirements, input.config);
    const evidence = this.evidenceLinker.link({
      config: input.config,
      recommendationEngine: input.engines.recommendationEngine,
      componentIds: requirements.targetComponentIds,
      layoutRegionIds: requirements.targetLayoutRegionIds,
    });

    const drafts: ProposalDraft[] = [];
    const seenTitles = new Set<string>();

    for (const category of strategy.categories) {
      for (let v = 0; v < strategy.variantsPerCategory; v++) {
        const draft = this.generateDraft(category, requirements, v);
        if (seenTitles.has(draft.title)) continue;
        seenTitles.add(draft.title);
        drafts.push(draft);
        if (drafts.length >= input.config.maximumProposalCount) break;
      }
      if (drafts.length >= input.config.maximumProposalCount) break;
    }

    while (drafts.length < input.config.minimumProposalCount) {
      const filler = this.layoutGen.generate(requirements, drafts.length);
      if (seenTitles.has(filler.title)) break;
      seenTitles.add(filler.title);
      drafts.push(filler);
    }

    let proposals: RedesignProposalRecord[] = drafts.map((d) =>
      buildProposalRecord(d, requirements, evidence.linkedUxFindingIds, this.metadata),
    );

    proposals = this.capabilityMapper.enrich({
      proposals,
      config: input.config,
      autonomousBuilderCertification: input.engines.autonomousBuilderCertification,
    });

    appendProposalLog({
      event: "proposal_generation",
      level: "info",
      details: `Generated ${proposals.length} proposal(s) across ${new Set(proposals.map((p) => p.proposalCategory)).size} categories`,
    });

    session = this.sessions.appendProposals(session.sessionId, proposals, "validated");
    const validation = this.validator.validate(proposals, input.config, {
      appliedChanges: false,
      approvedChanges: false,
    });

    appendProposalLog({
      event: "multi_proposal_generation_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Generation ${validation.decision.toUpperCase()} · ${proposals.length} options`,
    });

    return {
      proposalGenerationRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      session: { ...session, status: "completed" },
      proposals,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PROPOSAL_METADATA_VERSION,
    };
  }

  private generateDraft(
    category: ProposalCategory,
    requirements: ReturnType<ProposalRequirementInterpreter["interpret"]>,
    variantIndex: number,
  ): ProposalDraft {
    switch (category) {
      case "layout_redesign":
        return this.layoutGen.generate(requirements, variantIndex);
      case "component_redesign":
        return this.componentGen.generate(requirements, variantIndex);
      case "navigation_redesign":
        return this.navigationGen.generate(requirements, variantIndex);
      case "workflow_redesign":
        return this.workflowGen.generate(requirements, variantIndex);
      case "theme_redesign":
        return this.themeGen.generate(requirements, variantIndex);
      case "accessibility_improvement":
        return this.accessibilityGen.generate(requirements, variantIndex);
      case "visual_consistency_improvement":
        return this.consistencyGen.generate(requirements, variantIndex);
      default:
        return this.extendedGen.generate(
          category as Parameters<ExtendedProposalGenerator["generate"]>[0],
          requirements,
          variantIndex,
        );
    }
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
