/**
 * G7-02 — Payment operation controller (Stripe).
 */

import type { CommerceOperation } from "../../contracts/commerce-operations-types.js";
import { summarizeChannelOperations, type ChannelStatusSummary } from "./channel-status-types.js";

export function getPaymentOperationStatus(operations: CommerceOperation[]): ChannelStatusSummary {
  return summarizeChannelOperations("payment", operations, (op) => op.channelType === "payment");
}
