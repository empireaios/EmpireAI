/** R5-02 — Ad Account Manager. */

import { appendMaiLog } from "./mai-logging.js";
import type { MetaAdsIntegrationConfiguration } from "./configuration.js";
import type { ManageAdAccountInput, ManageBusinessAccountInput } from "./types.js";

export type ManagedAccounts = {
  businessAccountId: string;
  adAccountId: string;
  businessName: string | null;
  currency: string;
};

export class AdAccountManager {
  private businessAccountId: string | null = null;
  private adAccountId: string | null = null;
  private businessName: string | null = null;
  private currency = "USD";

  manageBusinessAccount(
    input: ManageBusinessAccountInput,
    config: MetaAdsIntegrationConfiguration,
  ): ManagedAccounts {
    this.businessAccountId =
      input.businessAccountId ?? this.businessAccountId ?? config.defaultBusinessAccountId;
    this.businessName = input.businessName ?? this.businessName;
    this.adAccountId = this.adAccountId ?? config.defaultAdAccountId;

    appendMaiLog({
      event: "business_account_management",
      level: "info",
      details: `Business account managed: ${this.businessAccountId}`,
    });

    return this.snapshot();
  }

  manageAdAccount(
    input: ManageAdAccountInput,
    config: MetaAdsIntegrationConfiguration,
  ): ManagedAccounts {
    this.businessAccountId =
      input.businessAccountId ?? this.businessAccountId ?? config.defaultBusinessAccountId;
    this.adAccountId = input.adAccountId ?? this.adAccountId ?? config.defaultAdAccountId;
    this.currency = input.currency ?? this.currency;

    appendMaiLog({
      event: "ad_account_management",
      level: "info",
      details: `Ad account managed: ${this.adAccountId}`,
    });

    return this.snapshot();
  }

  ensureDefaults(config: MetaAdsIntegrationConfiguration): ManagedAccounts {
    this.businessAccountId = this.businessAccountId ?? config.defaultBusinessAccountId;
    this.adAccountId = this.adAccountId ?? config.defaultAdAccountId;
    return this.snapshot();
  }

  getBusinessAccountId(): string | null {
    return this.businessAccountId;
  }

  getAdAccountId(): string | null {
    return this.adAccountId;
  }

  resetForTesting(): void {
    this.businessAccountId = null;
    this.adAccountId = null;
    this.businessName = null;
    this.currency = "USD";
  }

  private snapshot(): ManagedAccounts {
    return {
      businessAccountId: this.businessAccountId!,
      adAccountId: this.adAccountId!,
      businessName: this.businessName,
      currency: this.currency,
    };
  }
}
