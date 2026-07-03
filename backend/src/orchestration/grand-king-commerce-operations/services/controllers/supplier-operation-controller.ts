/**
 * G7-02 — Supplier operation controller (CJdropshipping).
 */

import type { CommerceOperation } from "../../contracts/commerce-operations-types.js";
import { summarizeChannelOperations, type ChannelStatusSummary } from "./channel-status-types.js";

export function getSupplierOperationStatus(operations: CommerceOperation[]): ChannelStatusSummary {
  return summarizeChannelOperations("supplier", operations, (op) => op.channelType === "supplier");
}
