/** R3-17 — Export record registry. */

import type { ExportRecord } from "./types.js";

export class ExportRegistry {
  private readonly exports = new Map<string, ExportRecord>();
  private lastExportKey: string | null = null;

  store(record: ExportRecord, dedupeKey?: string): void {
    this.exports.set(record.exportRecordId, record);
    if (dedupeKey) this.lastExportKey = dedupeKey;
  }

  get(exportRecordId: string): ExportRecord | null {
    return this.exports.get(exportRecordId) ?? null;
  }

  hasExportKey(key: string): boolean {
    return this.lastExportKey === key;
  }

  list(): ExportRecord[] {
    return [...this.exports.values()];
  }

  latest(): ExportRecord | null {
    const list = this.list();
    return list[list.length - 1] ?? null;
  }

  resetForTesting(): void {
    this.exports.clear();
    this.lastExportKey = null;
  }
}
