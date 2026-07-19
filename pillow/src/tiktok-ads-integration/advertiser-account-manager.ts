/** R5-04 — Advertiser Account Manager. */

import { appendTaiLog } from "./tai-logging.js";
import type { TikTokAdsIntegrationConfiguration } from "./configuration.js";
import type { ManageAdvertiserAccountInput } from "./types.js";

export type ManagedAdvertiserAccount = {
  advertiserAccountId: string;
  advertiserName: string | null;
  currency: string;
};

export class AdvertiserAccountManager {
  private advertiserAccountId: string | null = null;
  private advertiserName: string | null = null;
  private currency = "USD";

  manageAdvertiserAccount(
    input: ManageAdvertiserAccountInput,
    config: TikTokAdsIntegrationConfiguration,
  ): ManagedAdvertiserAccount {
    this.advertiserAccountId =
      input.advertiserAccountId ?? this.advertiserAccountId ?? config.defaultAdvertiserAccountId;
    this.advertiserName = input.advertiserName ?? this.advertiserName;
    this.currency = input.currency ?? this.currency;

    appendTaiLog({
      event: "advertiser_account_management",
      level: "info",
      details: `Advertiser account managed: ${this.advertiserAccountId}`,
    });

    return this.snapshot();
  }

  ensureDefaults(config: TikTokAdsIntegrationConfiguration): ManagedAdvertiserAccount {
    this.advertiserAccountId = this.advertiserAccountId ?? config.defaultAdvertiserAccountId;
    return this.snapshot();
  }

  getAdvertiserAccountId(): string | null {
    return this.advertiserAccountId;
  }

  resetForTesting(): void {
    this.advertiserAccountId = null;
    this.advertiserName = null;
    this.currency = "USD";
  }

  private snapshot(): ManagedAdvertiserAccount {
    return {
      advertiserAccountId: this.advertiserAccountId!,
      advertiserName: this.advertiserName,
      currency: this.currency,
    };
  }
}
