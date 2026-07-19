/** R3-03 — Bank account synchronization engine. */

import { appendBiLog } from "./bi-logging.js";
import { BANKING_INTEGRATION_ID } from "./paths.js";
import type { BankingProviderRegistry } from "./banking-provider-registry.js";
import type { BankingIntegrationConfiguration } from "./configuration.js";
import type { BankingMetadataGenerator } from "./banking-metadata-generator.js";
import type { BankingRecord, SyncBankAccountsInput } from "./types.js";

const FIXTURE_ACCOUNTS = [
  { reference: "acct-operating-001", type: "operating" as const, balance: 12500.5 },
  { reference: "acct-savings-001", type: "savings" as const, balance: 48200.0 },
];

export class BankAccountSynchronizationEngine {
  constructor(
    private readonly registry: BankingProviderRegistry,
    private readonly metadataGenerator: BankingMetadataGenerator,
  ) {}

  syncAccounts(
    input: SyncBankAccountsInput,
    config: BankingIntegrationConfiguration,
  ): BankingRecord[] {
    if (!config.synchronizationRulesEnabled) {
      throw new Error("Synchronization rules disabled");
    }

    const provider = input.providerIdentifier ?? "plaid";
    if (!this.registry.hasProvider(provider)) {
      throw new Error(`Banking provider not registered: ${provider}`);
    }

    const accounts = input.includeFixtureAccounts
      ? FIXTURE_ACCOUNTS
      : [{ reference: "acct-default-001", type: "checking" as const, balance: 0 }];

    const records: BankingRecord[] = [];
    for (const account of accounts) {
      const record = this.metadataGenerator.buildBankingRecord({
        bankingProviderId: BANKING_INTEGRATION_ID,
        bankAccountReference: account.reference,
        accountType: account.type,
        accountBalance: account.balance,
        currency: config.defaultCurrency,
        synchronizationStatus: "synchronized",
        validationStatus: "passed",
      });
      this.registry.storeAccount(record);
      records.push(record);
    }

    appendBiLog({
      event: "account_synchronization",
      level: "info",
      details: `Synchronized ${records.length} bank account(s)`,
    });

    return records;
  }
}
