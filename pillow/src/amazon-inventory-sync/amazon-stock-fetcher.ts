/** R1-05 — Amazon stock fetcher. */

import type { AmazonInventoryApiClient } from "./amazon-inventory-api-client.js";
import { appendInventoryLog } from "./amzinv-logging.js";
import type { AmazonInventorySyncConfiguration } from "./configuration.js";
import type {
  FetchAmazonInventoryInput,
  RawAmazonInventoryPayload,
  SyncAmazonInventoryInput,
} from "./types.js";

export class AmazonStockFetcher {
  constructor(private readonly apiClient: AmazonInventoryApiClient) {}

  async fetchAll(
    input: SyncAmazonInventoryInput,
    config: AmazonInventorySyncConfiguration,
    fixtureOptions?: Parameters<AmazonInventoryApiClient["fetchInventorySummaries"]>[2],
  ): Promise<RawAmazonInventoryPayload[]> {
    const region = input.region ?? "na";
    appendInventoryLog({
      event: "stock_fetch_start",
      level: "info",
      details: `Stock fetch started (forceFull=${Boolean(input.forceFullSync)})`,
    });
    return this.apiClient.fetchInventorySummaries(region, config, fixtureOptions);
  }

  async fetchOne(
    input: FetchAmazonInventoryInput,
    config: AmazonInventorySyncConfiguration,
  ): Promise<RawAmazonInventoryPayload | null> {
    return this.apiClient.fetchInventoryBySku(input, config);
  }
}
