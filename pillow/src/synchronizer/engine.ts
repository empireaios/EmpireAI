import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RepositoryMemoryEngine } from "../memory/engine.js";
import { inspectRepositoryState } from "../recovery/inspector.js";
import {
  approvalRecommendation,
  canExecuteSync,
  createApproval,
  validateApproval,
} from "./approval-gate.js";
import { detectChanges } from "./change-detector.js";
import { applyApprovedSync } from "./executor.js";
import { generateSyncPreview } from "./preview.js";
import type {
  DetectedChange,
  RepositorySynchronizerOptions,
  RepositorySynchronizerState,
  SyncApproval,
  SyncApprovalOutcome,
  SyncExecutionResult,
  SyncPreview,
  SyncPreviewResult,
  SyncRecord,
  SyncRequest,
} from "./types.js";
import { verifySynchronization } from "./verifier.js";

export const SYNC_DOCTRINE_PATHS = [
  "EMPIREAI_JOURNEY_FIRST_DOCTRINE.md",
  "EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md",
  "EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md",
];

/**
 * Repository Synchronizer (PILLOW-010).
 * Repository maintenance engine — preview first, approval required, verify after apply.
 */
export class RepositorySynchronizerEngine {
  private initializedAt: string | null = null;
  private history: SyncRecord[] = [];
  private previews = new Map<string, SyncPreviewResult["preview"]>();
  private reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private memory: RepositoryMemoryEngine,
    private options: RepositorySynchronizerOptions = {},
  ) {
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<RepositorySynchronizerState> {
    for (const docPath of SYNC_DOCTRINE_PATHS) {
      const text = await this.reader.readText(docPath);
      if (!text) {
        throw new Error(
          `${docPath} missing — Repository Synchronizer requires governance doctrines.`,
        );
      }
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): RepositorySynchronizerState {
    if (!this.initializedAt) {
      throw new Error(
        "Repository Synchronizer not initialized. Call initialize() first.",
      );
    }
    return {
      synchronizerVersion: "PILLOW-010",
      status: "ready",
      initializedAt: this.initializedAt,
      doctrinePaths: SYNC_DOCTRINE_PATHS,
      totalSyncs: this.history.length,
      lastSync: this.history.at(-1) ?? null,
    };
  }

  /** Preview Mode — never writes. */
  async previewSync(request: SyncRequest = {}): Promise<SyncPreviewResult> {
    this.memory.ensureFresh();
    const mem = this.memory.getMemory();
    const inspection = await inspectRepositoryState(this.bootstrap.repositoryRoot);
    const changes = detectChanges(this.bootstrap, mem, inspection, request);
    const preview = generateSyncPreview(changes, inspection, {
      missionId: request.missionId,
      missionTitle: request.missionTitle,
    });

    this.previews.set(preview.previewId, preview);

    return {
      preview,
      recommendation: preview.approvalRequired
        ? "Grand King approval required before any repository write"
        : "No synchronization writes required",
    };
  }

  /** Full synchronization workflow: preview → approval → execute → verify. */
  async synchronize(
    request: SyncRequest,
    approvalOutcome?: SyncApprovalOutcome,
    approvalNotes?: string,
  ): Promise<SyncExecutionResult> {
    const previewResult = await this.previewSync(request);
    const preview = previewResult.preview;

    const approval = createApproval(
      preview.previewId,
      approvalOutcome ?? "deferred",
      approvalNotes,
    );

    return this.executeWithApproval(preview, approval);
  }

  async executeWithApproval(
    preview: SyncPreview,
    approval: SyncApproval,
  ): Promise<SyncExecutionResult> {
    const validation = validateApproval(preview, approval);
    const dryRun = this.options.dryRunExecution ?? true;
    let synchronized = false;
    let verification = null;
    let proposalsApplied = 0;

    if (!validation.valid) {
      const record = this.buildRecord(preview, approval, null, false, dryRun, 0);
      this.history.push(record);
      return {
        record,
        synchronized: false,
        preview,
        verification: null,
        recommendation: validation.reason,
      };
    }

    if (!canExecuteSync(approval)) {
      const record = this.buildRecord(preview, approval, null, false, dryRun, 0);
      this.history.push(record);
      return {
        record,
        synchronized: false,
        preview,
        verification: null,
        recommendation: approvalRecommendation(approval.outcome),
      };
    }

    const applyResult = await applyApprovedSync(
      this.bootstrap.repositoryRoot,
      preview,
      dryRun,
    );
    proposalsApplied = applyResult.applied;

    const postInspection = await inspectRepositoryState(this.bootstrap.repositoryRoot);
    verification = await verifySynchronization(this.reader, preview, postInspection);
    synchronized = verification.passed && applyResult.applied > 0;

    const record = this.buildRecord(
      preview,
      approval,
      verification,
      synchronized,
      dryRun,
      proposalsApplied,
    );
    this.history.push(record);

    return {
      record,
      synchronized,
      preview,
      verification,
      recommendation: synchronized
        ? "Synchronization complete — verification passed"
        : "Synchronization applied but verification reported issues",
    };
  }

  private buildRecord(
    preview: SyncPreview,
    approval: SyncApproval,
    verification: SyncExecutionResult["verification"],
    synchronized: boolean,
    dryRun: boolean,
    proposalsApplied: number,
  ): SyncRecord {
    return {
      recordId: randomUUID(),
      previewId: preview.previewId,
      timestamp: new Date().toISOString(),
      reason: preview.changes.map((c: DetectedChange) => c.summary).join("; ") || "sync",
      affectedArtifacts: preview.affectedFiles,
      approval,
      verification,
      executed: synchronized || (proposalsApplied > 0 && approval.outcome === "approved"),
      dryRun,
      proposalsApplied,
    };
  }

  getPreview(previewId: string): SyncPreview | undefined {
    return this.previews.get(previewId);
  }

  getHistory(missionId?: string): SyncRecord[] {
    if (missionId) {
      return this.history.filter((r) => r.reason.includes(missionId));
    }
    return [...this.history];
  }

  getLastSync(): SyncRecord | null {
    return this.history.at(-1) ?? null;
  }
}

export function createRepositorySynchronizerEngine(
  bootstrap: EmpireBootstrapContext,
  memory: RepositoryMemoryEngine,
  options?: RepositorySynchronizerOptions,
): RepositorySynchronizerEngine {
  return new RepositorySynchronizerEngine(bootstrap, memory, options);
}
