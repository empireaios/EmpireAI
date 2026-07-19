/** R3-03 — Banking provider registry. */

import { appendBiLog } from "./bi-logging.js";
import type {
  BankingRecord,
  BankingTransactionRecord,
  RegisterBankingProviderInput,
} from "./types.js";

export class BankingProviderRegistry {
  private providers = new Set<string>();
  private accounts = new Map<string, BankingRecord>();
  private transactions = new Map<string, BankingTransactionRecord>();

  registerProvider(input: RegisterBankingProviderInput): void {
    this.providers.add(input.providerIdentifier);
    appendBiLog({
      event: "banking_provider_registration",
      level: "info",
      details: `Registered banking provider ${input.providerIdentifier}`,
    });
  }

  hasProvider(providerIdentifier: string): boolean {
    return this.providers.has(providerIdentifier);
  }

  listProviders(): string[] {
    return [...this.providers];
  }

  storeAccount(record: BankingRecord): void {
    this.accounts.set(record.bankAccountReference, record);
  }

  getAccount(bankAccountReference: string): BankingRecord | null {
    return this.accounts.get(bankAccountReference) ?? null;
  }

  listAccounts(): BankingRecord[] {
    return [...this.accounts.values()];
  }

  updateAccount(
    bankAccountReference: string,
    patch: Partial<BankingRecord>,
  ): BankingRecord | null {
    const existing = this.accounts.get(bankAccountReference);
    if (!existing) return null;
    const updated = { ...existing, ...patch, timestamp: new Date().toISOString() };
    this.accounts.set(bankAccountReference, updated);
    return updated;
  }

  storeTransaction(record: BankingTransactionRecord): void {
    this.transactions.set(record.transactionId, record);
  }

  listTransactions(bankingRecordId?: string): BankingTransactionRecord[] {
    const all = [...this.transactions.values()];
    return bankingRecordId
      ? all.filter((t) => t.bankingRecordId === bankingRecordId)
      : all;
  }

  resetForTesting(): void {
    this.providers.clear();
    this.accounts.clear();
    this.transactions.clear();
  }
}
