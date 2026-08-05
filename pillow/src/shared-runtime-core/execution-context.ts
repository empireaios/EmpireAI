import { SRTC_METADATA_VERSION } from "./paths.js";
import { nextSrtcId } from "./runtime-store.js";
import type { RuntimeStore } from "./runtime-store.js";
import type { ExecutionContext } from "./types.js";

export class ExecutionContextManager {
  constructor(private readonly store: RuntimeStore) {}

  create(factoryKeys: string[], workerIds: string[], metadata: Record<string, string> = {}): ExecutionContext {
    const now = new Date().toISOString();
    const context: ExecutionContext = {
      contextId: nextSrtcId("srtc-ctx"),
      createdAt: now,
      propagatedAt: now,
      traceabilityRefs: ["q10-01", "shared-runtime-core", "execution-context"],
      factoryKeys: [...factoryKeys].sort(),
      workerIds: [...workerIds].sort(),
      metadata: { ...metadata },
      metadataVersion: SRTC_METADATA_VERSION,
      neverExecuteBusinessSpecificDecisions: true,
      structuralSignalOnly: true,
    };
    this.store.saveContext(context);
    return context;
  }

  propagate(contextId: string): ExecutionContext | null {
    const existing = this.store.listContexts().find((c) => c.contextId === contextId);
    if (!existing) return null;
    const propagated: ExecutionContext = {
      ...existing,
      propagatedAt: new Date().toISOString(),
      traceabilityRefs: [...existing.traceabilityRefs, "propagated"],
    };
    this.store.saveContext(propagated);
    return propagated;
  }

  list() {
    return this.store.listContexts();
  }
}
