/**
 * G7-02 — Marketplace operation controller (Amazon).
 */

import type { CommerceOperation } from "../../contracts/commerce-operations-types.js";
import { summarizeChannelOperations, type ChannelStatusSummary } from "./channel-status-types.js";

export function getMarketplaceOperationStatus(operations: CommerceOperation[]): ChannelStatusSummary {
  return summarizeChannelOperations("marketplace", operations, (op) => op.channelType === "marketplace");
}
