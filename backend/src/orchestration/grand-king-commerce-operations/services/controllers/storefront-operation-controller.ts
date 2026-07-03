/**
 * G7-02 — Storefront operation controller (Shopify).
 */

import type { CommerceOperation } from "../../contracts/commerce-operations-types.js";
import { summarizeChannelOperations, type ChannelStatusSummary } from "./channel-status-types.js";

export function getStorefrontOperationStatus(operations: CommerceOperation[]): ChannelStatusSummary {
  return summarizeChannelOperations("storefront", operations, (op) => op.channelType === "storefront");
}
