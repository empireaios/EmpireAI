/** R3-03 — Account balance synchronization. */

import { appendBiLog } from "./bi-logging.js";
import type { BankingProviderRegistry } from "./banking-provider-registry.js";
import type { BankingIntegrationConfiguration } from "./configuration.js";
import type { BankingRecord, SyncAccountBalancesInput } from "./types.js";

const FIXTURE_BALANCES: Record<string, number> = {
  "acct-operating-001": 12750.25,
  "acct-savings-001": 48550.0,
  "acct-default-001": 1000.0,
};

export class AccountBalanceSynchronizationEngine {
  constructor(private readonly registry: BankingProviderRegistry) {}

  syncBalances(
    input: SyncAccountBalancesInput,
    config: BankingIntegrationConfiguration,
  ): BankingRecord[] {
    if (!config.synchronizationRulesEnabled) {
      throw new Error("Synchronization rules disabled");
    }

    const accounts = input.bankAccountReference
      ? [this.registry.getAccount(input.bankAccountReference)].filter(Boolean)
      : this.registry.listAccounts();

    if (accounts.length === 0) {
      throw new Error("No bank accounts available for balance synchronization");
    }

    const updated: BankingRecord[] = [];
    const now = new Date().toISOString();

    for (const account of accounts as BankingRecord[]) {
      const balance = input.includeFixtureBalances
        ? (FIXTURE_BALANCES[account.bankAccountReference] ?? account.accountBalance)
        : account.accountBalance;

      const record = this.registry.updateAccount(account.bankAccountReference, {
        accountBalance: balance,
        synchronizationStatus: "synchronized",
        lastSynchronizationTimestamp: now,
        validationStatus: "passed",
      });
      if (record) updated.push(record);
    }

    appendBiLog({
      event: "balance_synchronization",
      level: "info",
      details: `Synchronized balances for ${updated.length} account(s)`,
    });

    return updated;
  }
}
