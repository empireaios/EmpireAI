import { MEMRT_METADATA_VERSION } from "./paths.js";
import { nextMemrtId } from "./memory-store.js";
import type { MemoryStore } from "./memory-store.js";
import type { ContextIndexer } from "./context-indexer.js";
import type { MemrtInput, ContextBundle } from "./types.js";

export class ContextProvider {
  constructor(private readonly indexer: ContextIndexer) {}

  provideRuntimeContext(store: MemoryStore, input: MemrtInput): ContextBundle {
    const entries = store.listEntries();
    const criteria = {
      factory: input.factory ?? undefined,
      worker: input.worker ?? undefined,
      missionId: input.missionId ?? undefined,
      sessionId: input.sessionId ?? undefined,
      contextId: input.contextId ?? undefined,
    };

    const related = this.indexer.findRelated(entries, criteria);

    const bundle: ContextBundle = {
      bundleId: nextMemrtId("memrt-ctx"),
      worker: input.worker ?? null,
      factory: input.factory ?? null,
      missionId: input.missionId ?? null,
      sessionId: input.sessionId ?? null,
      contextId: input.contextId ?? null,
      operationalMemories: related.filter((e) => e.memoryType === "operational"),
      decisionHistory: related.filter((e) => e.memoryType === "decision_history"),
      previousResults: related.filter((e) => e.memoryType === "previous_result"),
      runtimeContext: related.filter((e) => e.memoryType === "runtime_context"),
      assembledAt: new Date().toISOString(),
      metadataVersion: MEMRT_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };

    store.saveContextBundle(bundle);
    return bundle;
  }
}
