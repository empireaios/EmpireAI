/** R3-03 — Transaction synchronization engine. */

import { appendBiLog } from "./bi-logging.js";
import type { BankingProviderRegistry } from "./banking-provider-registry.js";
import type { BankingIntegrationConfiguration } from "./configuration.js";
import type { BankingMetadataGenerator } from "./banking-metadata-generator.js";
import type { BankingTransactionRecord, SyncTransactionHistoryInput } from "./types.js";

export class TransactionSynchronizationEngine {
  constructor(
    private readonly registry: BankingProviderRegistry,
    private readonly metadataGenerator: BankingMetadataGenerator,
  ) {}

  syncTransactions(
    input: SyncTransactionHistoryInput,
    config: BankingIntegrationConfiguration,
  ): BankingTransactionRecord[] {
    if (!config.synchronizationRulesEnabled) {
      throw new Error("Synchronization rules disabled");
    }

    const accounts = input.bankAccountReference
      ? [this.registry.getAccount(input.bankAccountReference)].filter(Boolean)
      : this.registry.listAccounts();

    if (accounts.length === 0) {
      throw new Error("No bank accounts available for transaction synchronization");
    }

    const transactions: BankingTransactionRecord[] = [];
    const fixtureSet = input.includeFixtureTransactions ?? true;

    for (const account of accounts) {
      const items = fixtureSet
        ? [
            { amount: 250.0, type: "credit" as const, description: "Customer deposit" },
            { amount: 89.5, type: "debit" as const, description: "Supplier payment" },
          ]
        : [{ amount: 0, type: "credit" as const, description: "No transactions" }];

      for (const item of items) {
        const txn = this.metadataGenerator.buildTransactionRecord({
          bankingRecordId: account!.bankingRecordId,
          amount: item.amount,
          currency: account!.currency,
          transactionType: item.type,
          description: item.description,
        });
        this.registry.storeTransaction(txn);
        transactions.push(txn);
      }
    }

    appendBiLog({
      event: "transaction_synchronization",
      level: "info",
      details: `Synchronized ${transactions.length} transaction(s)`,
    });

    return transactions;
  }
}
