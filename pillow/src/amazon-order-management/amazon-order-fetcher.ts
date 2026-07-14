/** R1-04 — Amazon order fetcher. */

import type { AmazonOrderApiClient } from "./amazon-order-api-client.js";
import { appendOrderLog } from "./amzord-logging.js";
import type { AmazonOrderManagementConfiguration } from "./configuration.js";
import type { FetchAmazonOrderInput, RawAmazonOrderPayload, SyncAmazonOrdersInput } from "./types.js";

export class AmazonOrderFetcher {
  constructor(private readonly apiClient: AmazonOrderApiClient) {}

  async fetchAll(
    input: SyncAmazonOrdersInput,
    config: AmazonOrderManagementConfiguration,
    fixtureOptions?: Parameters<AmazonOrderApiClient["fetchOrders"]>[2],
  ): Promise<RawAmazonOrderPayload[]> {
    const region = input.region ?? "na";
    appendOrderLog({
      event: "order_fetch_start",
      level: "info",
      details: `Order fetch started (forceFull=${Boolean(input.forceFullSync)})`,
    });
    return this.apiClient.fetchOrders(region, config, fixtureOptions);
  }

  async fetchOne(
    input: FetchAmazonOrderInput,
    config: AmazonOrderManagementConfiguration,
  ): Promise<RawAmazonOrderPayload | null> {
    return this.apiClient.fetchOrderById(input, config);
  }
}
