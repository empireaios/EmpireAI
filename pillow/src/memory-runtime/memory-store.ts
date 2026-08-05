import type {
  ContextBundle,
  MemoryEntry,
  MemoryRuntimeReport,
  MemoryVersion,
  RetrievalResult,
} from "./types.js";

let sequence = 0;

export function resetMemrtSequenceForTesting() {
  sequence = 0;
}

export function nextMemrtId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export class MemoryStore {
  private entries = new Map<string, MemoryEntry>();
  private reports: MemoryRuntimeReport[] = [];
  private contextBundles: ContextBundle[] = [];
  private retrievalResults: RetrievalResult[] = [];
  private auditTrail: string[] = [];

  saveEntry(entry: MemoryEntry) {
    const snapshot = this.cloneEntry(entry);
    this.entries.set(entry.memoryId, snapshot);
    this.auditTrail.push(`entry_saved:${entry.memoryId}@${entry.updatedAt}`);
    return snapshot;
  }

  getEntry(memoryId: string) {
    const entry = this.entries.get(memoryId);
    return entry ? this.cloneEntry(entry) : null;
  }

  listEntries() {
    return [...this.entries.values()].map((e) => this.cloneEntry(e));
  }

  /** Returns deep-frozen version payloads — never mutate after save. */
  getVersion(memoryId: string, versionNumber: number): MemoryVersion | null {
    const entry = this.entries.get(memoryId);
    if (!entry) return null;
    const version = entry.versions.find((v) => v.versionNumber === versionNumber);
    return version ? { ...version } : null;
  }

  updateLastAccess(memoryId: string, accessedAt: string) {
    const entry = this.entries.get(memoryId);
    if (!entry) return null;
    entry.lastAccessAt = accessedAt;
    entry.updatedAt = accessedAt;
    this.auditTrail.push(`entry_accessed:${memoryId}@${accessedAt}`);
    return this.cloneEntry(entry);
  }

  saveReport(report: MemoryRuntimeReport) {
    this.reports.push({ ...report, memoryInventory: report.memoryInventory.map((e) => this.cloneEntry(e)) });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
    return report;
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  saveContextBundle(bundle: ContextBundle) {
    this.contextBundles.push({
      ...bundle,
      operationalMemories: bundle.operationalMemories.map((e) => this.cloneEntry(e)),
      decisionHistory: bundle.decisionHistory.map((e) => this.cloneEntry(e)),
      previousResults: bundle.previousResults.map((e) => this.cloneEntry(e)),
      runtimeContext: bundle.runtimeContext.map((e) => this.cloneEntry(e)),
    });
    return bundle;
  }

  listContextBundles() {
    return this.contextBundles.map((b) => ({
      ...b,
      operationalMemories: b.operationalMemories.map((e) => this.cloneEntry(e)),
      decisionHistory: b.decisionHistory.map((e) => this.cloneEntry(e)),
      previousResults: b.previousResults.map((e) => this.cloneEntry(e)),
      runtimeContext: b.runtimeContext.map((e) => this.cloneEntry(e)),
    }));
  }

  saveRetrievalResult(result: RetrievalResult) {
    this.retrievalResults.push({
      ...result,
      matches: result.matches.map((e) => this.cloneEntry(e)),
    });
    return result;
  }

  listRetrievalResults() {
    return this.retrievalResults.map((r) => ({
      ...r,
      matches: r.matches.map((e) => this.cloneEntry(e)),
    }));
  }

  getAuditTrail() {
    return [...this.auditTrail];
  }

  getHistory() {
    return {
      entries: this.listEntries(),
      reports: this.listReports(),
      contextBundles: this.listContextBundles(),
      retrievals: this.listRetrievalResults(),
    };
  }

  private cloneEntry(entry: MemoryEntry): MemoryEntry {
    return {
      ...entry,
      tags: [...entry.tags],
      traceabilityRefs: [...entry.traceabilityRefs],
      versions: entry.versions.map((v) => ({ ...v })),
    };
  }
}
