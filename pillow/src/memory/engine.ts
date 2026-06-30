import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { ContextBuilder } from "../context/engine.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import {
  buildMemoryFingerprint,
  buildRepositoryMemory,
  verifyMemoryProvenance,
} from "./builder.js";
import type { MemoryService, RepositoryMemoryState } from "./types.js";

export interface RepositoryMemoryEngineOptions {
  contextBuilder?: ContextBuilder | null;
}

/**
 * Repository Memory Engine (PILLOW-005).
 * Long-term operational memory derived from repository — read-only.
 */
export class RepositoryMemoryEngine {
  private state: RepositoryMemoryState | null = null;
  private storedFingerprint: string | null = null;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private intelligence: RepositoryIntelligenceContext,
    private options: RepositoryMemoryEngineOptions = {},
  ) {}

  /** Initialize memory after Bootstrap + Intelligence (PILLOW-005). */
  initialize(): RepositoryMemoryState {
    this.state = buildRepositoryMemory(this.bootstrap, this.intelligence);
    this.storedFingerprint = this.state.repositoryFingerprint;
    return this.state;
  }

  /** Refresh when repository fingerprint changes. */
  refresh(
    bootstrap?: EmpireBootstrapContext,
    intelligence?: RepositoryIntelligenceContext,
  ): RepositoryMemoryState {
    if (bootstrap) this.bootstrap = bootstrap;
    if (intelligence) this.intelligence = intelligence;

    const nextFingerprint = buildMemoryFingerprint(
      this.bootstrap,
      this.intelligence,
    );

    const wasStale = this.isStale(nextFingerprint);
    this.state = buildRepositoryMemory(this.bootstrap, this.intelligence);
    this.state.consistency.stale = wasStale;
    this.storedFingerprint = nextFingerprint;

    if (wasStale && this.options.contextBuilder) {
      this.options.contextBuilder.refreshFingerprint();
    }

    return this.state;
  }

  getMemory(): RepositoryMemoryState {
    if (!this.state) {
      throw new Error(
        "Repository Memory not initialized. Call initialize() first.",
      );
    }
    return this.state;
  }

  isStale(nextFingerprint?: string): boolean {
    if (!this.storedFingerprint) return false;
    const fp =
      nextFingerprint ??
      buildMemoryFingerprint(this.bootstrap, this.intelligence);
    return fp !== this.storedFingerprint;
  }

  ensureFresh(): RepositoryMemoryState {
    if (!this.state || this.isStale()) {
      return this.refresh();
    }
    return this.state;
  }

  verifyIntegrity(): { valid: boolean; violations: string[] } {
    const memory = this.getMemory();
    const violations = verifyMemoryProvenance(memory);
    return { valid: violations.length === 0, violations };
  }

  /** Downstream Pillow modules consume memory through named services. */
  getServiceSnapshot(service: MemoryService): RepositoryMemoryState {
    const memory = this.ensureFresh();
    void service;
    return memory;
  }

  updateSources(
    bootstrap: EmpireBootstrapContext,
    intelligence: RepositoryIntelligenceContext,
  ): RepositoryMemoryState {
    this.bootstrap = bootstrap;
    this.intelligence = intelligence;
    return this.refresh();
  }
}

export function createRepositoryMemoryEngine(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
  options?: RepositoryMemoryEngineOptions,
): RepositoryMemoryEngine {
  const engine = new RepositoryMemoryEngine(bootstrap, intelligence, options);
  engine.initialize();
  return engine;
}
