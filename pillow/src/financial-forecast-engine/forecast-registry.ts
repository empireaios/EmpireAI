/** R3-13 — Forecast record registry. */

import type { ForecastRecord } from "./types.js";

export class ForecastRegistry {
  private readonly records = new Map<string, ForecastRecord>();
  private readonly dedupeKeys = new Set<string>();

  store(record: ForecastRecord, dedupeKey?: string): void {
    this.records.set(record.forecastRecordId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  get(forecastRecordId: string): ForecastRecord | null {
    return this.records.get(forecastRecordId) ?? null;
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  list(): ForecastRecord[] {
    return [...this.records.values()];
  }

  latest(): ForecastRecord | null {
    const list = this.list();
    return list[list.length - 1] ?? null;
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
  }
}
