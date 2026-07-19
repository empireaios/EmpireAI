/** R3-12 — Currency record registry. */

import type { CurrencyGainLossRecord, CurrencyRecord, ExchangeRateRecord } from "./types.js";

export class CurrencyRegistry {
  private readonly records = new Map<string, CurrencyRecord>();
  private readonly dedupeKeys = new Set<string>();
  private readonly gainLossRecords: CurrencyGainLossRecord[] = [];

  store(record: CurrencyRecord, dedupeKey?: string): void {
    this.records.set(record.currencyRecordId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  update(record: CurrencyRecord): void {
    this.records.set(record.currencyRecordId, record);
  }

  get(currencyRecordId: string): CurrencyRecord | null {
    return this.records.get(currencyRecordId) ?? null;
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  markDedupeKey(key: string): void {
    this.dedupeKeys.add(key);
  }

  list(): CurrencyRecord[] {
    return [...this.records.values()];
  }

  storeGainLoss(record: CurrencyGainLossRecord): void {
    this.gainLossRecords.push(record);
  }

  listGainLoss(): CurrencyGainLossRecord[] {
    return [...this.gainLossRecords];
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
    this.gainLossRecords.length = 0;
  }
}

export class ExchangeRateRegistry {
  private readonly rates = new Map<string, ExchangeRateRecord>();
  private readonly history: ExchangeRateRecord[] = [];

  private key(source: string, target: string): string {
    return `${source}:${target}`;
  }

  store(record: ExchangeRateRecord): void {
    this.rates.set(this.key(record.sourceCurrency, record.targetCurrency), record);
    this.history.push(record);
  }

  get(source: string, target: string): ExchangeRateRecord | null {
    return this.rates.get(this.key(source, target)) ?? null;
  }

  list(): ExchangeRateRecord[] {
    return [...this.rates.values()];
  }

  listHistory(): ExchangeRateRecord[] {
    return [...this.history];
  }

  resetForTesting(): void {
    this.rates.clear();
    this.history.length = 0;
  }
}
