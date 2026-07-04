import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import {
  formatRepositoryKnowledgeAnswer,
  queryRepositoryKnowledge,
} from "../repository-intelligence/query-engine.js";
import { formatKnowledgeModelSummary } from "../repository-intelligence/knowledge-model.js";
import type { TechnicalChiefEngine } from "../technical-chief/engine.js";
import type { UxDesignerEngine } from "../ux-designer/engine.js";
import type { CursorBridgeEngine } from "../cursor-bridge/engine.js";
import type { InfrastructureCommanderEngine } from "../infrastructure-commander/engine.js";
import type { CommerceIntelligenceEngine } from "../commerce-intelligence/engine.js";
import type { EmpireCommanderEngine } from "../empire-commander/engine.js";
import type { EmpireOperatingSystemEngine } from "../empire-operating-system/engine.js";
import {
  buildRepositoryFingerprint,
  cacheKeyForTask,
  ContextCache,
} from "./cache.js";
import { resolveContextTask } from "./intent.js";
import { loadContextSlices, totalSliceBytes } from "./loader.js";
import { estimateTokens, selectSourcesForTask } from "./selector.js";
import type {
  ContextBuildRequest,
  ContextBuilderOptions,
  IntelligenceSnapshot,
  OperationalContext,
} from "./types.js";

/**
 * Context Builder (PILLOW-004).
 * Assembles smallest complete operational context per task — read-only.
 */
export class ContextBuilder {
  private readonly reader: RepositoryReader;
  private readonly cache: ContextCache;
  private readonly cacheEnabled: boolean;
  private fingerprint: string;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    private readonly intelligence: RepositoryIntelligenceContext,
    private readonly technicalChief?: TechnicalChiefEngine,
    private readonly uxDesigner?: UxDesignerEngine,
    private readonly cursorBridge?: CursorBridgeEngine,
    private readonly infrastructureCommander?: InfrastructureCommanderEngine,
    private readonly commerceIntelligence?: CommerceIntelligenceEngine,
    private readonly empireCommander?: EmpireCommanderEngine,
    private readonly empireOperatingSystem?: EmpireOperatingSystemEngine,
    options: ContextBuilderOptions = {},
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.cache = new ContextCache();
    this.cacheEnabled = options.cacheEnabled !== false;
    this.fingerprint = buildRepositoryFingerprint(bootstrap);
  }

  get repositoryFingerprint(): string {
    return this.fingerprint;
  }

  /** Recompute fingerprint — call after external repository changes. */
  refreshFingerprint(): void {
    this.fingerprint = buildRepositoryFingerprint(this.bootstrap);
    this.cache.invalidateAll();
  }

  invalidateCache(): void {
    this.cache.invalidateAll();
  }

  async build(request: ContextBuildRequest = {}): Promise<OperationalContext> {
    const started = performance.now();
    const task = resolveContextTask(request.userMessage, request.task);
    const cacheKey = cacheKeyForTask(task);

    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey, this.fingerprint);
      if (cached) return cached;
    }

    const sources = selectSourcesForTask(task, this.bootstrap, this.intelligence);
    const slices = await loadContextSlices(this.reader, sources);
    const totalBytes = totalSliceBytes(slices);
    const durationMs = Math.round(performance.now() - started);

    const repositoryKnowledgeAnswer = resolveRepositoryKnowledgeAnswer(
      request.userMessage,
      task,
      this.intelligence,
    );

    const technicalChiefBrief = resolveTechnicalChiefBrief(
      request.userMessage,
      task,
      this.technicalChief,
    );

    const uxDesignBrief = resolveUxDesignBrief(
      request.userMessage,
      task,
      this.uxDesigner,
    );

    const cursorBridgeBrief = resolveCursorBridgeBrief(
      request.userMessage,
      task,
      this.cursorBridge,
    );

    const infrastructureBrief = await resolveInfrastructureBrief(
      request.userMessage,
      task,
      this.infrastructureCommander,
    );

    const commerceIntelligenceBrief = resolveCommerceIntelligenceBrief(
      request.userMessage,
      task,
      this.commerceIntelligence,
    );

    const empireCommanderBrief = await resolveEmpireCommanderBrief(
      request.userMessage,
      task,
      this.empireCommander,
    );

    const empireOperatingSystemBrief = await resolveEmpireOperatingSystemBrief(
      request.userMessage,
      task,
      this.empireOperatingSystem,
    );

    const context: OperationalContext = {
      manifest: {
        contextVersion: "PILLOW-004",
        task,
        artifactIds: slices.map((s) => s.id),
        paths: slices.map((s) => s.path),
        sliceCount: slices.length,
        totalBytes,
        estimatedTokens: estimateTokens(totalBytes),
        cached: false,
        repositoryFingerprint: this.fingerprint,
        builtAt: new Date().toISOString(),
        durationMs,
      },
      slices,
      intelligenceSnapshot: buildIntelligenceSnapshot(this.intelligence, this.bootstrap),
      repositoryKnowledgeAnswer,
      technicalChiefBrief,
      uxDesignBrief,
      cursorBridgeBrief,
      infrastructureBrief,
      commerceIntelligenceBrief,
      empireCommanderBrief,
      empireOperatingSystemBrief,
    };

    if (this.cacheEnabled) {
      this.cache.set(cacheKey, this.fingerprint, context);
    }

    return context;
  }
}

function buildIntelligenceSnapshot(
  intelligence: RepositoryIntelligenceContext,
  bootstrap: EmpireBootstrapContext,
): IntelligenceSnapshot {
  return {
    healthScore: intelligence.health.score,
    currentMission: bootstrap.currentMission,
    journeyPosition: bootstrap.journeyPosition,
    healthIssueCount: intelligence.health.issues.length,
  };
}

function resolveRepositoryKnowledgeAnswer(
  userMessage: string | undefined,
  task: import("./types.js").ContextTask,
  intelligence: RepositoryIntelligenceContext,
): string | undefined {
  if (!userMessage?.trim()) return undefined;

  const shouldQuery =
    task === "repository_intelligence" ||
    task === "architecture" ||
    /where is|who owns|depends on|what happens if|how does|which file renders|which mission/i.test(
      userMessage,
    );

  if (!shouldQuery) return undefined;

  const result = queryRepositoryKnowledge(userMessage, intelligence.knowledgeModel);
  const answer = formatRepositoryKnowledgeAnswer(result);
  if (!answer) return undefined;

  const summary = formatKnowledgeModelSummary(intelligence.knowledgeModel);
  return `${summary}\n\n--- Deterministic Q&A ---\n${answer}`;
}

function resolveTechnicalChiefBrief(
  userMessage: string | undefined,
  task: import("./types.js").ContextTask,
  technicalChief?: TechnicalChiefEngine,
): string | undefined {
  if (!userMessage?.trim() || !technicalChief) return undefined;

  const shouldAnalyze =
    task === "technical_chief" ||
    task === "recovery" ||
    /root cause|diagnose|why.*fail|failed to fetch|502|503|504|what broke|safest fix|technical chief/i.test(
      userMessage,
    );

  if (!shouldAnalyze) return undefined;

  const analysis = technicalChief.analyzeIssue({ problemDescription: userMessage });
  return analysis.executiveBrief;
}

function resolveUxDesignBrief(
  userMessage: string | undefined,
  task: import("./types.js").ContextTask,
  uxDesigner?: UxDesignerEngine,
): string | undefined {
  if (!userMessage?.trim() || !uxDesigner) return undefined;

  const shouldDesign =
    task === "ux_design" ||
    task === "continue_ux" ||
    /make .+ pink|homepage|redesign|apple[- ]style|premium|spacing|neon|readability|replace card|darker colou?r/i.test(
      userMessage,
    );

  if (!shouldDesign) return undefined;

  const result = uxDesigner.designFromRequest(userMessage);
  return result.executiveBrief;
}

function resolveCursorBridgeBrief(
  userMessage: string | undefined,
  task: import("./types.js").ContextTask,
  cursorBridge?: CursorBridgeEngine,
): string | undefined {
  if (!userMessage?.trim() || !cursorBridge) return undefined;

  const shouldBridge =
    task === "cursor_bridge" ||
    task === "generate_cursor_mission" ||
    /deploy|investigate|review cursor|architectural weakness|recommend improvement|prepare production|engineering chief/i.test(
      userMessage,
    );

  if (!shouldBridge) return undefined;

  const result = cursorBridge.processInstruction(userMessage);
  return result.executiveBrief;
}

async function resolveInfrastructureBrief(
  userMessage: string | undefined,
  task: import("./types.js").ContextTask,
  commander?: InfrastructureCommanderEngine,
): Promise<string | undefined> {
  if (!userMessage?.trim() || !commander) return undefined;

  const shouldReport =
    task === "infrastructure" ||
    task === "recovery" ||
    task === "cursor_bridge" ||
    /infrastructure|railway|vercel|deployment status|production readiness|platform health|service availability/i.test(
      userMessage,
    );

  if (!shouldReport) return undefined;

  const report = await commander.generateExecutiveReport(userMessage);
  return report.executiveBrief;
}

function resolveCommerceIntelligenceBrief(
  userMessage: string | undefined,
  task: import("./types.js").ContextTask,
  commerce?: CommerceIntelligenceEngine,
): string | undefined {
  if (!userMessage?.trim() || !commerce) return undefined;

  const shouldAnalyze =
    task === "commerce_intelligence" ||
    /product|supplier|market|launch|competitor|commerce|dropship|margin|winning/i.test(
      userMessage,
    );

  if (!shouldAnalyze) return undefined;

  const report = commerce.analyzeCommerce(userMessage);
  return report.executiveBrief;
}

async function resolveEmpireCommanderBrief(
  userMessage: string | undefined,
  task: import("./types.js").ContextTask,
  commander?: EmpireCommanderEngine,
): Promise<string | undefined> {
  if (!userMessage?.trim() || !commander) return undefined;

  const shouldCommand =
    task === "empire_commander" ||
    task === "empire_progress" ||
    /empire health|executive commander|strategic plan|overall empire|prioriti[sz]e empire|cross-domain|empire commander/i.test(
      userMessage,
    );

  if (!shouldCommand) return undefined;

  const report = await commander.commandEmpire(userMessage);
  return report.executiveBrief;
}

async function resolveEmpireOperatingSystemBrief(
  userMessage: string | undefined,
  task: import("./types.js").ContextTask,
  eos?: EmpireOperatingSystemEngine,
): Promise<string | undefined> {
  if (!userMessage?.trim() || !eos) return undefined;

  const shouldOperate =
    task === "empire_operating_system" ||
    /create (a )?company|launch business|operate empire|empire operating|manage business|scale empire|company portfolio|empire os/i.test(
      userMessage,
    );

  if (!shouldOperate) return undefined;

  const report = await eos.operateEmpire(userMessage);
  return report.executiveBrief;
}

export async function runContextBuild(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  request: ContextBuildRequest = {},
  options?: ContextBuilderOptions,
  technicalChief?: TechnicalChiefEngine,
  uxDesigner?: UxDesignerEngine,
  cursorBridge?: CursorBridgeEngine,
  infrastructureCommander?: InfrastructureCommanderEngine,
  commerceIntelligence?: CommerceIntelligenceEngine,
  empireCommander?: EmpireCommanderEngine,
  empireOperatingSystem?: EmpireOperatingSystemEngine,
): Promise<OperationalContext> {
  const builder = new ContextBuilder(
    bootstrap,
    intelligence,
    technicalChief,
    uxDesigner,
    cursorBridge,
    infrastructureCommander,
    commerceIntelligence,
    empireCommander,
    empireOperatingSystem,
    options,
  );
  return builder.build(request);
}
