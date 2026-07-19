/** R5-03 — Advertising Account Manager. */

import { appendGaiLog } from "./gai-logging.js";
import type { GoogleAdsIntegrationConfiguration } from "./configuration.js";
import type { ManageAdvertisingAccountInput, ManageCustomerAccountInput } from "./types.js";

export type ManagedAccounts = {
  customerAccountId: string;
  advertisingAccountId: string;
  customerName: string | null;
  currency: string;
};

export class AdvertisingAccountManager {
  private customerAccountId: string | null = null;
  private advertisingAccountId: string | null = null;
  private customerName: string | null = null;
  private currency = "USD";

  manageCustomerAccount(
    input: ManageCustomerAccountInput,
    config: GoogleAdsIntegrationConfiguration,
  ): ManagedAccounts {
    this.customerAccountId =
      input.customerAccountId ?? this.customerAccountId ?? config.defaultCustomerAccountId;
    this.customerName = input.customerName ?? this.customerName;
    this.advertisingAccountId = this.advertisingAccountId ?? config.defaultAdvertisingAccountId;

    appendGaiLog({
      event: "customer_account_management",
      level: "info",
      details: `Customer account managed: ${this.customerAccountId}`,
    });

    return this.snapshot();
  }

  manageAdvertisingAccount(
    input: ManageAdvertisingAccountInput,
    config: GoogleAdsIntegrationConfiguration,
  ): ManagedAccounts {
    this.customerAccountId =
      input.customerAccountId ?? this.customerAccountId ?? config.defaultCustomerAccountId;
    this.advertisingAccountId = input.advertisingAccountId ?? this.advertisingAccountId ?? config.defaultAdvertisingAccountId;
    this.currency = input.currency ?? this.currency;

    appendGaiLog({
      event: "advertising_account_management",
      level: "info",
      details: `Advertising account managed: ${this.advertisingAccountId}`,
    });

    return this.snapshot();
  }

  ensureDefaults(config: GoogleAdsIntegrationConfiguration): ManagedAccounts {
    this.customerAccountId = this.customerAccountId ?? config.defaultCustomerAccountId;
    this.advertisingAccountId = this.advertisingAccountId ?? config.defaultAdvertisingAccountId;
    return this.snapshot();
  }

  getCustomerAccountId(): string | null {
    return this.customerAccountId;
  }

  getAdvertisingAccountId(): string | null {
    return this.advertisingAccountId;
  }

  resetForTesting(): void {
    this.customerAccountId = null;
    this.advertisingAccountId = null;
    this.customerName = null;
    this.currency = "USD";
  }

  private snapshot(): ManagedAccounts {
    return {
      customerAccountId: this.customerAccountId!,
      advertisingAccountId: this.advertisingAccountId!,
      customerName: this.customerName,
      currency: this.currency,
    };
  }
}
