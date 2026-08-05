import { MEMRT_METADATA_VERSION } from "./paths.js";
import { nextMemrtId } from "./memory-store.js";
import type { MemoryStore } from "./memory-store.js";
import type { LineageTracker } from "./lineage-tracker.js";
import type { VersioningEngine } from "./versioning-engine.js";
import type { MemoryRuntimeConfiguration } from "./configuration.js";
import type { MemrtInput, MemoryEntry, MemoryType } from "./types.js";

export class MemoryWriter {
  constructor(
    private readonly versioning: VersioningEngine,
    private readonly lineage: LineageTracker,
  ) {}

  store(
    store: MemoryStore,
    input: MemrtInput,
    config: MemoryRuntimeConfiguration,
    memoryType: MemoryType = input.memoryType ?? "operational",
  ): MemoryEntry {
    const now = new Date().toISOString();
    const contentRef = input.contentRef ?? "";
    const summary = input.summary ?? contentRef;

    if (input.memoryId) {
      const existing = store.getEntry(input.memoryId);
      if (existing) {
        return this.updateExisting(store, existing, input, contentRef, summary);
      }
    }

    const memoryId = input.memoryId ?? nextMemrtId("memrt-mem");
    const base: MemoryEntry = {
      memoryId,
      memoryType,
      factory: input.factory ?? null,
      worker: input.worker ?? null,
      missionId: input.missionId ?? null,
      sessionId: input.sessionId ?? null,
      contextId: input.contextId ?? null,
      sourceRef: input.sourceRef ?? null,
      contentRef,
      summary,
      tags: [...(input.tags ?? [])],
      governanceClassification: input.governanceClassification ?? "internal",
      retentionStatus: "active",
      currentVersion: 0,
      versions: [],
      parentMemoryId: input.parentMemoryId ?? null,
      createdAt: now,
      updatedAt: now,
      lastAccessAt: null,
      highRisk: input.highRisk === true,
      pillowConfirmed: input.pillowConfirmed === true,
      grandKingApproved: input.grandKingApproved === true,
      traceabilityRefs: [input.sourceRef ?? `memrt://store/${memoryId}`],
      metadataVersion: MEMRT_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };

    const linked = this.lineage.linkParent(base, input.parentMemoryId ?? null);
    const version = this.versioning.createInitialVersion(linked, contentRef, summary);
    const entry: MemoryEntry = {
      ...linked,
      currentVersion: 1,
      versions: [version],
    };

    return store.saveEntry(entry);
  }

  storeDecision(store: MemoryStore, input: MemrtInput, config: MemoryRuntimeConfiguration): MemoryEntry {
    return this.store(store, input, config, "decision_history");
  }

  storePreviousResult(store: MemoryStore, input: MemrtInput, config: MemoryRuntimeConfiguration): MemoryEntry {
    return this.store(store, input, config, "previous_result");
  }

  storeRuntimeContext(store: MemoryStore, input: MemrtInput, config: MemoryRuntimeConfiguration): MemoryEntry {
    return this.store(store, input, config, "runtime_context");
  }

  private updateExisting(
    store: MemoryStore,
    existing: MemoryEntry,
    input: MemrtInput,
    contentRef: string,
    summary: string,
  ): MemoryEntry {
    const { entry } = this.versioning.appendVersion(
      existing,
      contentRef,
      summary,
      input.parentMemoryId ?? existing.parentMemoryId,
    );
    if (input.tags?.length) {
      entry.tags = Array.from(new Set([...entry.tags, ...input.tags]));
    }
    entry.traceabilityRefs = [
      ...entry.traceabilityRefs,
      input.sourceRef ?? `memrt://update/${entry.memoryId}/v${entry.currentVersion}`,
    ];
    return store.saveEntry(entry);
  }
}
