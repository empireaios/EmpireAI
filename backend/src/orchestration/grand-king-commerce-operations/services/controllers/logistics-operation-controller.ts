/**
 * G7-02 — Logistics operation controller (shipment tracking via supplier channels).
 */

import type { CommerceOperation } from "../../contracts/commerce-operations-types.js";
import { summarizeChannelOperations, type ChannelStatusSummary } from "./channel-status-types.js";

export function getLogisticsOperationStatus(operations: CommerceOperation[]): ChannelStatusSummary {
  return summarizeChannelOperations(
    "logistics",
    operations,
    (op) => op.operationType === "shipment_tracking" || op.channelType === "supplier",
  );
}
