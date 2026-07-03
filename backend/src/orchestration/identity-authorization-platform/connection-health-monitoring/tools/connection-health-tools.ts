/**
 * G8-04 — Connection Health Monitoring Brain tools (never expose raw secrets).
 */

import type { RegisteredTool } from "../../../../brain/types.js";
import {
  assertNoSecretsInHealthPayload,
  redactConnectionHealthSecrets,
} from "../contracts/connection-health-types.js";
import { buildCockpitConnectionHealthView } from "../contracts/connection-health-cockpit-contracts.js";
import {
  getConnectionHealthAttentionItems,
  getConnectionHealthDetail,
  getConnectionHealthSummary,
  getProviderHealthMatrix,
  listConnectionHealthChecks,
  runConnectionHealthCheck,
} from "../services/connection-monitoring-service.js";

function safePayload(value: unknown) {
  const redacted = redactConnectionHealthSecrets(value);
  assertNoSecretsInHealthPayload(redacted);
  return redacted;
}

export const connectionHealthTools: RegisteredTool[] = [
  {
    name: "connection_health_list",
    description: "G8-04 — List connection health checks (metadata only, secrets redacted)",
    module: "connection-health-monitoring",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    handler: async (args) =>
      safePayload(listConnectionHealthChecks({ workspaceId: String(args.workspaceId ?? "ws_empire_1") })),
  },
  {
    name: "connection_health_detail",
    description: "G8-04 — Connection health detail for a provider",
    module: "connection-health-monitoring",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        providerId: { type: "string" },
      },
      required: ["providerId"],
    },
    handler: async (args) => {
      const detail = getConnectionHealthDetail(String(args.providerId));
      return safePayload(detail ?? { found: false });
    },
  },
  {
    name: "run_connection_health_check",
    description: "G8-04 — Run registry-driven health checks for a provider",
    module: "connection-health-monitoring",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        workspaceId: { type: "string" },
        accountHolderId: { type: "string" },
        providerId: { type: "string" },
        environment: { type: "string" },
      },
      required: ["actorId", "providerId"],
    },
    handler: async (args) =>
      safePayload(
        runConnectionHealthCheck({
          actorId: String(args.actorId),
          ownerId: String(args.ownerId ?? "grand-king"),
          workspaceId: String(args.workspaceId ?? "ws_empire_1"),
          accountHolderId: String(args.accountHolderId ?? "grand-king"),
          providerId: String(args.providerId),
          environment: args.environment === "sandbox" ? "sandbox" : "production",
          pillowGovernance: true,
        }),
      ),
  },
  {
    name: "connection_health_summary",
    description: "G8-04 — Workspace connection health summary",
    module: "connection-health-monitoring",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    handler: async (args) =>
      safePayload(
        getConnectionHealthSummary({
          workspaceId: String(args.workspaceId ?? "ws_empire_1"),
          context: { workspaceId: String(args.workspaceId ?? "ws_empire_1") },
        }),
      ),
  },
  {
    name: "connection_health_attention_items",
    description: "G8-04 — Connections requiring attention",
    module: "connection-health-monitoring",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    handler: async (args) =>
      safePayload(
        getConnectionHealthAttentionItems({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
      ),
  },
  {
    name: "provider_health_matrix",
    description: "G8-04 — Provider health matrix across all connections",
    module: "connection-health-monitoring",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    handler: async (args) =>
      safePayload({
        matrix: getProviderHealthMatrix({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
        cockpit: buildCockpitConnectionHealthView({ workspaceId: String(args.workspaceId ?? "ws_empire_1") }),
      }),
  },
];
