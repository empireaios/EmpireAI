/**
 * G7-02 — Analytics operation controller (Meta, Google, TikTok).
 */

import type { CommerceOperation } from "../../contracts/commerce-operations-types.js";
import { summarizeChannelOperations, type ChannelStatusSummary } from "./channel-status-types.js";

export function getAnalyticsOperationStatus(operations: CommerceOperation[]): ChannelStatusSummary {
  return summarizeChannelOperations("analytics", operations, (op) => op.channelType === "analytics");
}
