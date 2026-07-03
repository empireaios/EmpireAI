import type { OperationalContext } from "../context/types.js";
import type { ExecutiveReasoningComposition } from "../bootstrap/types.js";
import type { ExecutiveLearningReasoningBundle } from "../learning/types.js";
import type { PillowExecutiveRecommendation } from "../executive-perspectives/types.js";
import { formatExecutiveReasoningForLlm } from "../bootstrap/executive-reasoning-context.js";
import { formatExecutiveLearningForLlm } from "../learning/reasoning-bundle.js";
import { formatExecutiveRecommendationForLlm } from "../executive-perspectives/synthesis-engine.js";
import type {
  BrainLLMAdapter,
  BrainLLMCompleteRequest,
  BrainLLMMessage,
  BrainLLMProviderName,
} from "./brain-adapter.js";
import {
  budgetForMode,
  resolveOperatingMode,
  resolvePreferredProvider,
} from "./mode-policy.js";

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
}

/**
 * PILLOW-016 OpenAI Integration Layer.
 * Assembles Context Builder payloads and delegates completion to Brain LLMRouter via adapter.
 */
export class OpenAIIntegrationLayer {
  constructor(private readonly adapter: BrainLLMAdapter) {}

  listAvailableProviders(): BrainLLMProviderName[] {
    return this.adapter.listAvailableProviders();
  }

  async complete(request: PillowCompletionRequest): Promise<PillowCompletionResult> {
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
    );

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

    return {
      content: response.content,
      provider: response.provider,
      model: response.model,
      mode,
      manifestId: request.operationalContext.manifest.repositoryFingerprint,
      usage: response.usage,
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
): BrainLLMMessage[] {
  const snapshot = context.intelligenceSnapshot;
  const systemHeader = [
    "You are Pillow, the AI operating layer inside EmpireAI.",
    "Answer using the repository context below. Do not invent repository facts.",
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

  const systemContent = [
    systemHeader,
    executiveAnchor,
    learningAnchor,
    councilAnchor,
    technicalChiefAnchor,
    uxDesignAnchor,
    cursorBridgeAnchor,
    infrastructureAnchor,
    commerceIntelligenceAnchor,
    empireCommanderAnchor,
    repositoryKnowledge,
    contextBody,
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    {
      role: "system",
      content: systemContent,
    },
    { role: "user", content: userMessage },
  ];
}

export function createOpenAIIntegrationLayer(
  adapter: BrainLLMAdapter,
): OpenAIIntegrationLayer {
  return new OpenAIIntegrationLayer(adapter);
}
