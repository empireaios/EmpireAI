import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
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

export async function runContextBuild(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  request: ContextBuildRequest = {},
  options?: ContextBuilderOptions,
): Promise<OperationalContext> {
  const builder = new ContextBuilder(bootstrap, intelligence, options);
  return builder.build(request);
}
