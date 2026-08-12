import type { OperationalContext } from "../context/types.js";
import type { ExecutiveReasoningComposition } from "../bootstrap/types.js";
import type { ExecutiveLearningReasoningBundle } from "../learning/types.js";
import type { PillowExecutiveRecommendation } from "../executive-perspectives/types.js";
import { formatExecutiveReasoningForLlm } from "../bootstrap/executive-reasoning-context.js";
import { buildDigitalSoulPromptBlock } from "../digital-soul/prompt.js";
import { formatExecutiveLearningForLlm } from "../learning/reasoning-bundle.js";
import { formatExecutiveRecommendationForLlm } from "../executive-perspectives/synthesis-engine.js";
import type {
  BrainLLMAdapter,
  BrainLLMCompleteRequest,
  BrainLLMMessage,
  BrainLLMProviderName,
} from "./brain-adapter.js";
import {
  assessKnowledgeRouting,
  buildExecutiveConversationKnowledgeSection,
  buildKnowledgeRoutingPromptSection,
} from "./knowledge-routing.js";
import {
  budgetForMode,
  resolveOperatingMode,
  resolvePreferredProvider,
} from "./mode-policy.js";
import type { IntelligencePlatformEngine } from "../intelligence-platform/engine.js";
import type { EmpireAIArtifact } from "../intelligence-platform/types.js";

export interface PillowPriorConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface PillowCompletionRequest {
  operationalContext: OperationalContext;
  userMessage: string;
  workspaceId: string;
  correlationId: string;
  provider?: BrainLLMProviderName;
  model?: string;
  executiveReasoning?: ExecutiveReasoningComposition;
  executiveLearningBundle?: ExecutiveLearningReasoningBundle;
  executiveCouncilRecommendation?: PillowExecutiveRecommendation;
  /** Prior session turns (excluding the current user message). */
  priorConversationTurns?: PillowPriorConversationTurn[];
  /** Natural executive dialogue — suppresses template source labels. */
  executiveConversationMode?: boolean;
  actor?: string;
  /**
   * Mandatory attestation that Digital Soul constitutional gate already ran.
   * Tool / LLM completion refuses without this — no ungated executive path.
   */
  constitutionalGateAttestation?: {
    passed: true;
    gatedAt: string;
    purpose: "chat" | "tool" | "memory" | "command" | "assistant_action" | "natural_ux";
  };
}

export interface PillowCompletionResult {
  content: string;
  provider: BrainLLMProviderName;
  model: string;
  mode: ReturnType<typeof resolveOperatingMode>;
  manifestId: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  artifacts?: EmpireAIArtifact[];
  capabilitiesUsed?: string[];
  intelligenceRouting?: {
    primarySource: string;
    primaryCapability: string;
    rationale: string;
  };
}

/**
 * PILLOW-016 OpenAI Integration Layer.
 * Assembles Context Builder payloads and delegates completion to Brain LLMRouter via adapter.
 */
export class OpenAIIntegrationLayer {
  constructor(
    private readonly adapter: BrainLLMAdapter,
    private readonly intelligencePlatform?: IntelligencePlatformEngine,
  ) {}

  listAvailableProviders(): BrainLLMProviderName[] {
    return this.adapter.listAvailableProviders();
  }

  async complete(request: PillowCompletionRequest): Promise<PillowCompletionResult> {
    if (!request.constitutionalGateAttestation?.passed) {
      throw new Error(
        "Constitutional gate required: OpenAIIntegrationLayer.complete refused ungated executive completion. Call gateExecutiveConversation before LLM or tool execution.",
      );
    }

    const mode = resolveOperatingMode(request.operationalContext.manifest.task);
    const budget = budgetForMode(mode);
    const available = this.adapter.listAvailableProviders();
    const provider = resolvePreferredProvider(available, request.provider);

    if (!provider) {
      throw new Error(
        "No LLM providers configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_AI_API_KEY on the Brain backend.",
      );
    }

    const messages = assembleLlmMessages(
      request.operationalContext,
      request.userMessage,
      mode,
      request.executiveReasoning ?? request.operationalContext.executiveReasoning,
      request.executiveLearningBundle,
      request.executiveCouncilRecommendation,
      this.intelligencePlatform,
      request.priorConversationTurns,
      request.executiveConversationMode,
    );

    const systemContext = messages.find((m) => m.role === "system")?.content ?? "";

    if (this.intelligencePlatform && !request.executiveConversationMode) {
      const routing = this.intelligencePlatform.assessRouting(
        request.userMessage,
        request.operationalContext,
      );
      const specialCapabilities = new Set([
        "web_search",
        "file_search",
        "file_analysis",
        "image_generation",
        "vision",
        "code_execution",
      ]);
      if (specialCapabilities.has(routing.primaryCapability)) {
        // Tools execute only after mandatory Digital Soul gate attestation (checked above).
        const platformResult = await this.intelligencePlatform.execute({
          operationalContext: request.operationalContext,
          userMessage: request.userMessage,
          workspaceId: request.workspaceId,
          correlationId: request.correlationId,
          owner: request.actor ?? "grand_king",
          missionId: request.operationalContext.intelligenceSnapshot.currentMission,
          systemContext,
        });
        return {
          content: platformResult.content,
          provider,
          model: request.model ?? "intelligence-platform",
          mode,
          manifestId: request.operationalContext.manifest.repositoryFingerprint,
          artifacts: platformResult.artifacts,
          capabilitiesUsed: platformResult.capabilitiesUsed,
          intelligenceRouting: {
            primarySource: platformResult.routing.primarySource,
            primaryCapability: platformResult.routing.primaryCapability,
            rationale: platformResult.routing.rationale,
          },
        };
      }
    }

    const llmRequest: BrainLLMCompleteRequest = {
      messages,
      provider,
      model: request.model,
      temperature: budget.temperature,
      maxTokens: budget.maxCompletionTokens,
      workspaceId: request.workspaceId,
      correlationId: request.correlationId,
    };

    const response = await this.adapter.complete(llmRequest);

    let artifacts: EmpireAIArtifact[] | undefined;
    if (this.intelligencePlatform) {
      const chatArtifact = this.intelligencePlatform.getArtifactRegistry().register({
        artifactType: "chat_response",
        sourceTool: "general_knowledge",
        missionId: request.operationalContext.intelligenceSnapshot.currentMission,
        owner: request.actor ?? "grand_king",
        title: `Chat: ${request.userMessage.slice(0, 60)}`,
        content: response.content,
        metadata: { provider: response.provider, model: response.model },
      });
      artifacts = [chatArtifact];
    }

    const routing = this.intelligencePlatform?.assessRouting(
      request.userMessage,
      request.operationalContext,
    );

    return {
      content: response.content,
      provider: response.provider,
      model: response.model,
      mode,
      manifestId: request.operationalContext.manifest.repositoryFingerprint,
      usage: response.usage,
      artifacts,
      capabilitiesUsed: routing ? [routing.primaryCapability] : undefined,
      intelligenceRouting: routing
        ? {
            primarySource: routing.primarySource,
            primaryCapability: routing.primaryCapability,
            rationale: routing.rationale,
          }
        : undefined,
    };
  }
}

function assembleLlmMessages(
  context: OperationalContext,
  userMessage: string,
  mode: ReturnType<typeof resolveOperatingMode>,
  executiveReasoning?: ExecutiveReasoningComposition,
  executiveLearningBundle?: ExecutiveLearningReasoningBundle,
  executiveCouncilRecommendation?: PillowExecutiveRecommendation,
  intelligencePlatform?: IntelligencePlatformEngine,
  priorConversationTurns?: PillowPriorConversationTurn[],
  executiveConversationMode?: boolean,
): BrainLLMMessage[] {
  const snapshot = context.intelligenceSnapshot;
  const hasRepositoryKnowledge = Boolean(context.repositoryKnowledgeAnswer?.trim());
  const knowledgeRouting = assessKnowledgeRouting(userMessage, {
    hasRepositoryAnswer: hasRepositoryKnowledge,
    contextTask: context.manifest.task,
  });
  const knowledgeRoutingPolicy = executiveConversationMode
    ? buildExecutiveConversationKnowledgeSection(
        knowledgeRouting,
        hasRepositoryKnowledge,
        userMessage,
      )
    : intelligencePlatform
      ? intelligencePlatform.buildRoutingPromptSection(userMessage, context)
      : buildKnowledgeRoutingPromptSection(
          knowledgeRouting,
          hasRepositoryKnowledge,
          userMessage,
        );

  const systemHeader = [
    "You are Pillow, the AI operating layer inside EmpireAI.",
    "Constitutional authority: Digital Soul of Pillow V2 (DS-V2-CANONICAL).",
    knowledgeRoutingPolicy,
    `Operating mode: ${mode}`,
    `Context task: ${context.manifest.task}`,
    `Repository fingerprint: ${context.manifest.repositoryFingerprint}`,
    snapshot.journeyPosition
      ? `Journey position: ${snapshot.journeyPosition}`
      : null,
    snapshot.currentMission ? `Current mission: ${snapshot.currentMission}` : null,
    `Repository health score: ${snapshot.healthScore}`,
  ]
    .filter(Boolean)
    .join("\n");

  const digitalSoulAnchor = executiveReasoning
    ? null
    : buildDigitalSoulPromptBlock();

  const executiveAnchor = executiveReasoning
    ? formatExecutiveReasoningForLlm(executiveReasoning)
    : null;

  const learningAnchor = executiveLearningBundle
    ? formatExecutiveLearningForLlm(executiveLearningBundle)
    : null;

  const councilAnchor = executiveCouncilRecommendation
    ? formatExecutiveRecommendationForLlm(executiveCouncilRecommendation)
    : null;

  const contextBody = context.slices
    .map((slice) => `--- ${slice.path} ---\n${slice.content}`)
    .join("\n\n");

  const repositoryKnowledge = context.repositoryKnowledgeAnswer
    ? `--- Repository Intelligence (Phase 2) ---\n${context.repositoryKnowledgeAnswer}`
    : null;

  const technicalChiefAnchor = context.technicalChiefBrief
    ? `--- Technical Chief (Phase 3) ---\n${context.technicalChiefBrief}\nUse this engineering analysis as authoritative pre-Cursor diagnosis. Do not contradict root cause without new evidence.`
    : null;

  const uxDesignAnchor = context.uxDesignBrief
    ? `--- AI UX Designer (Phase 4) ---\n${context.uxDesignBrief}\nUse Option A as default unless King selects B or C. Present engineering spec and Cursor mission to King. Do not ask for technical implementation details.`
    : null;

  const cursorBridgeAnchor = context.cursorBridgeBrief
    ? `--- Autonomous Cursor Bridge (Phase 5) ---\n${context.cursorBridgeBrief}\nPillow is Engineering Chief. Dispatch complete missions to Cursor. Validate results. Report completion. Grand King gives business instructions only.`
    : null;

  const infrastructureAnchor = context.infrastructureBrief
    ? `--- Infrastructure Commander (Phase 6) ---\n${context.infrastructureBrief}\nPillow coordinates GitHub, Railway, and Vercel. Alert Grand King only when executive attention is required.`
    : null;

  const commerceIntelligenceAnchor = context.commerceIntelligenceBrief
    ? `--- Commerce Intelligence Executive (Phase 7) ---\n${context.commerceIntelligenceBrief}\nPillow performs product, supplier, competitor, and market intelligence. Grand King decides business direction only.`
    : null;

  const empireCommanderAnchor = context.empireCommanderBrief
    ? `--- Empire Commander (Phase 8) ---\n${context.empireCommanderBrief}\nPillow is unified executive intelligence. The King gives strategic direction; Pillow plans, coordinates, evaluates, and reports across all domains.`
    : null;

  const empireOperatingSystemAnchor = context.empireOperatingSystemBrief
    ? `--- Empire Operating System (Phase 9) ---\n${context.empireOperatingSystemBrief}\nPillow executes the Empire. The King provides vision; Pillow creates, launches, operates, optimises, and scales businesses autonomously.`
    : null;

  const continuousEvolutionAnchor = context.continuousEvolutionBrief
    ? `--- Continuous Empire Evolution (Phase 10) ---\n${context.continuousEvolutionBrief}\nPillow continuously evolves the Empire. Never wait for problems — analyse, discover, recommend, and improve continuously.`
    : null;

  const screenAwarenessAnchor = context.screenAwarenessBrief
    ? `--- Screen Awareness (T-Series) ---\n${context.screenAwarenessBrief}\nAnswer the Grand King's question using this active screen context. Do not substitute unrelated certification blockers unless explicitly asked.`
    : null;

  const liveTruthAnchor = context.liveOperationalTruthBrief
    ? `${context.liveOperationalTruthBrief}\nThis Live Operational Truth block outranks repository journey/status text, demo commerce briefs, and prior chat when they conflict.`
    : null;

  // Demo/static commerce briefs must not override live commissioning identity.
  const commerceAnchor =
    liveTruthAnchor != null
      ? null
      : commerceIntelligenceAnchor;

  const systemContent = [
    systemHeader,
    liveTruthAnchor,
    digitalSoulAnchor,
    executiveAnchor,
    learningAnchor,
    councilAnchor,
    technicalChiefAnchor,
    uxDesignAnchor,
    cursorBridgeAnchor,
    infrastructureAnchor,
    commerceAnchor,
    empireCommanderAnchor,
    empireOperatingSystemAnchor,
    continuousEvolutionAnchor,
    screenAwarenessAnchor,
    repositoryKnowledge,
    contextBody,
  ]
    .filter(Boolean)
    .join("\n\n");

  const priorMessages: BrainLLMMessage[] = (priorConversationTurns ?? []).map(
    (turn) => ({
      role: turn.role,
      content: turn.content,
    }),
  );

  return [
    {
      role: "system",
      content: systemContent,
    },
    ...priorMessages,
    { role: "user", content: userMessage },
  ];
}

export function createOpenAIIntegrationLayer(
  adapter: BrainLLMAdapter,
  intelligencePlatform?: IntelligencePlatformEngine,
): OpenAIIntegrationLayer {
  return new OpenAIIntegrationLayer(adapter, intelligencePlatform);
}
