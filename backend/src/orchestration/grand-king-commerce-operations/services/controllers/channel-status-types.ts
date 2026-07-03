/**
 * G7-02 — Channel status summary types for Cockpit controllers.
 */

import type { CommerceOperation } from "../../contracts/commerce-operations-types.js";

export type ChannelStatusSummary = {
  channelType: string;
  providerIds: string[];
  operationCount: number;
  runningCount: number;
  readyCount: number;
  blockedCount: number;
  overallStatus: "healthy" | "degraded" | "blocked" | "idle";
  operations: Array<Pick<CommerceOperation, "operationId" | "providerId" | "operationType" | "status">>;
};

export function summarizeChannelOperations(
  channelType: string,
  operations: CommerceOperation[],
  filter: (op: CommerceOperation) => boolean,
): ChannelStatusSummary {
  const channelOps = operations.filter(filter);
  const runningCount = channelOps.filter((op) => op.status === "running").length;
  const readyCount = channelOps.filter((op) => op.status === "ready").length;
  const blockedCount = channelOps.filter((op) => op.status === "blocked").length;
  let overallStatus: ChannelStatusSummary["overallStatus"] = "idle";
  if (blockedCount > 0) overallStatus = "blocked";
  else if (runningCount > 0) overallStatus = "healthy";
  else if (channelOps.some((op) => op.status === "degraded" || op.status === "incident")) {
    overallStatus = "degraded";
  } else if (readyCount > 0) overallStatus = "idle";

  return {
    channelType,
    providerIds: [...new Set(channelOps.map((op) => op.providerId))],
    operationCount: channelOps.length,
    runningCount,
    readyCount,
    blockedCount,
    overallStatus,
    operations: channelOps.map((op) => ({
      operationId: op.operationId,
      providerId: op.providerId,
      operationType: op.operationType,
      status: op.status,
    })),
  };
}
