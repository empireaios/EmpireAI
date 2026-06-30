import type { RegisteredTool } from "../../../brain/types.js";
import { ACCOUNT_PROVIDER_IDS } from "../models/account-provider.js";
import type { AccountProviderId } from "../models/account-provider.js";
import {
  completeAccountConnection,
  getAccountHealthSnapshot,
  getAccountProviderRegistry,
  getAccountReadiness,
  getExternalAccount,
  listExternalAccounts,
  startAccountSetup,
} from "../services/account-infrastructure-service.js";
import { formatReadinessSummaryText } from "../services/account-readiness-service.js";
import { listHumanActionQueue } from "../services/human-action-queue-service.js";

export const accountInfrastructureTools: RegisteredTool[] = [
  {
    name: "account_infrastructure.list",
    description: "List all external accounts in the unified registry for Grand King or Founder accounts",
    module: "account-infrastructure-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        accountType: { type: "string", enum: ["grand_king", "founder"] },
      },
    },
    handler: async (args) =>
      listExternalAccounts(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        (args.accountType as "grand_king" | "founder") ?? "grand_king",
      ),
  },
  {
    name: "account_infrastructure.get",
    description: "Get a single external account with health and pending human actions",
    module: "account-infrastructure-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        providerId: { type: "string", enum: ACCOUNT_PROVIDER_IDS },
      },
      required: ["providerId"],
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      const providerId = String(args.providerId) as AccountProviderId;
      const snapshot = getAccountHealthSnapshot(workspaceId, providerId);
      return {
        account: getExternalAccount(workspaceId, providerId),
        health: snapshot.health,
        pendingHumanActions: snapshot.pendingHumanActions,
      };
    },
  },
  {
    name: "account_infrastructure.readiness",
    description: "Get unified account readiness summary with overall readiness percentage",
    module: "account-infrastructure-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        accountType: { type: "string", enum: ["grand_king", "founder"] },
      },
    },
    handler: async (args) => {
      const summary = getAccountReadiness(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        (args.accountType as "grand_king" | "founder") ?? "grand_king",
      );
      return { summary, formatted: formatReadinessSummaryText(summary) };
    },
  },
  {
    name: "account_infrastructure.human_actions",
    description: "List human-only actions queued for the account owner — EA never bypasses these",
    module: "account-infrastructure-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        providerId: { type: "string", enum: ACCOUNT_PROVIDER_IDS },
        status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"] },
      },
    },
    handler: async (args) =>
      listHumanActionQueue(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", {
        providerId: args.providerId ? (String(args.providerId) as AccountProviderId) : undefined,
        status: args.status as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | undefined,
      }),
  },
  {
    name: "account_infrastructure.provider_registry",
    description: "Get provider definitions for all supported external services",
    module: "account-infrastructure-engine",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getAccountProviderRegistry(),
  },
  {
    name: "account_infrastructure.start_setup",
    description: "Start account setup flow — OAuth/API only, never passwords",
    module: "account-infrastructure-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        providerId: { type: "string", enum: ACCOUNT_PROVIDER_IDS },
        actor: { type: "string" },
      },
      required: ["providerId"],
    },
    handler: async (args) =>
      startAccountSetup(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.providerId) as AccountProviderId,
        args.actor ? String(args.actor) : "system",
      ),
  },
  {
    name: "account_infrastructure.complete_connection",
    description: "Complete account connection with vault credentials reference — no password storage",
    module: "account-infrastructure-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        providerId: { type: "string", enum: ACCOUNT_PROVIDER_IDS },
        credentialsRef: { type: "string" },
        actor: { type: "string" },
      },
      required: ["providerId", "credentialsRef"],
    },
    handler: async (args) =>
      completeAccountConnection(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.providerId) as AccountProviderId,
        {
          credentialsRef: String(args.credentialsRef),
          actor: args.actor ? String(args.actor) : undefined,
        },
      ),
  },
];
