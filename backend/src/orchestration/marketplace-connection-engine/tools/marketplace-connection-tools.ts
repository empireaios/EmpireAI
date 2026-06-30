import type { RegisteredTool } from "../../../brain/types.js";
import { MARKETPLACE_IDS } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import type { MarketplaceId } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import { MARKETPLACE_ACCOUNT_TYPES } from "../models/marketplace-connection-record.js";
import type { MarketplaceAccountType } from "../models/marketplace-connection-record.js";
import {
  completeMarketplaceConnectionFlow,
  getMarketplaceConnectionRecord,
  getMarketplacePublishingReadiness,
  listMarketplaceConnectionRecords,
  refreshMarketplaceConnectionFlow,
  revokeMarketplaceConnectionFlow,
  startMarketplaceConnectionFlow,
  verifyMarketplaceConnectionFlow,
} from "../services/marketplace-connection-service.js";

export const marketplaceConnectionTools: RegisteredTool[] = [
  {
    name: "marketplace_connection.list",
    description: "List all marketplace connection records for Grand King or Founder accounts",
    module: "marketplace-connection-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        accountType: { type: "string", enum: MARKETPLACE_ACCOUNT_TYPES },
      },
    },
    handler: async (args) =>
      listMarketplaceConnectionRecords(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        (args.accountType as MarketplaceAccountType) ?? "GRAND_KING",
      ),
  },
  {
    name: "marketplace_connection.get",
    description: "Get a single marketplace connection record with scopes and human steps",
    module: "marketplace-connection-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        marketplaceId: { type: "string", enum: MARKETPLACE_IDS },
        accountType: { type: "string", enum: MARKETPLACE_ACCOUNT_TYPES },
      },
      required: ["marketplaceId"],
    },
    handler: async (args) =>
      getMarketplaceConnectionRecord(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.marketplaceId) as MarketplaceId,
        (args.accountType as MarketplaceAccountType) ?? "GRAND_KING",
      ),
  },
  {
    name: "marketplace_connection.start",
    description: "Start marketplace connection workflow — OAuth/API blueprint, no passwords",
    module: "marketplace-connection-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        marketplaceId: { type: "string", enum: MARKETPLACE_IDS },
        accountType: { type: "string", enum: MARKETPLACE_ACCOUNT_TYPES },
        actor: { type: "string" },
      },
      required: ["marketplaceId"],
    },
    handler: async (args) =>
      startMarketplaceConnectionFlow({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        marketplaceId: String(args.marketplaceId) as MarketplaceId,
        accountType: (args.accountType as MarketplaceAccountType) ?? "GRAND_KING",
        actor: args.actor ? String(args.actor) : "system",
      }),
  },
  {
    name: "marketplace_connection.complete",
    description: "Complete marketplace connection with vault credentials reference only",
    module: "marketplace-connection-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        marketplaceId: { type: "string", enum: MARKETPLACE_IDS },
        credentialsRef: { type: "string" },
        grantedScopes: { type: "array", items: { type: "string" } },
        accountType: { type: "string", enum: MARKETPLACE_ACCOUNT_TYPES },
        actor: { type: "string" },
      },
      required: ["marketplaceId", "credentialsRef"],
    },
    handler: async (args) =>
      completeMarketplaceConnectionFlow({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        marketplaceId: String(args.marketplaceId) as MarketplaceId,
        credentialsRef: String(args.credentialsRef),
        grantedScopes: Array.isArray(args.grantedScopes) ? args.grantedScopes.map(String) : undefined,
        accountType: (args.accountType as MarketplaceAccountType) ?? "GRAND_KING",
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "marketplace_connection.refresh",
    description: "Refresh marketplace connection state and last verified timestamp",
    module: "marketplace-connection-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        marketplaceId: { type: "string", enum: MARKETPLACE_IDS },
        accountType: { type: "string", enum: MARKETPLACE_ACCOUNT_TYPES },
        actor: { type: "string" },
      },
      required: ["marketplaceId"],
    },
    handler: async (args) =>
      refreshMarketplaceConnectionFlow({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        marketplaceId: String(args.marketplaceId) as MarketplaceId,
        accountType: (args.accountType as MarketplaceAccountType) ?? "GRAND_KING",
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "marketplace_connection.revoke",
    description: "Revoke marketplace connection — clears vault reference, no credential plaintext",
    module: "marketplace-connection-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        marketplaceId: { type: "string", enum: MARKETPLACE_IDS },
        accountType: { type: "string", enum: MARKETPLACE_ACCOUNT_TYPES },
        actor: { type: "string" },
        reason: { type: "string" },
      },
      required: ["marketplaceId"],
    },
    handler: async (args) =>
      revokeMarketplaceConnectionFlow({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        marketplaceId: String(args.marketplaceId) as MarketplaceId,
        accountType: (args.accountType as MarketplaceAccountType) ?? "GRAND_KING",
        actor: args.actor ? String(args.actor) : undefined,
        reason: args.reason ? String(args.reason) : undefined,
      }),
  },
  {
    name: "marketplace_connection.verify",
    description: "Verify marketplace connection readiness without publishing products",
    module: "marketplace-connection-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        marketplaceId: { type: "string", enum: MARKETPLACE_IDS },
        accountType: { type: "string", enum: MARKETPLACE_ACCOUNT_TYPES },
      },
      required: ["marketplaceId"],
    },
    handler: async (args) =>
      verifyMarketplaceConnectionFlow({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        marketplaceId: String(args.marketplaceId) as MarketplaceId,
        accountType: (args.accountType as MarketplaceAccountType) ?? "GRAND_KING",
      }),
  },
  {
    name: "marketplace_connection.readiness",
    description: "Which marketplaces are ready for product publishing?",
    module: "marketplace-connection-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        accountType: { type: "string", enum: MARKETPLACE_ACCOUNT_TYPES },
      },
    },
    handler: async (args) =>
      getMarketplacePublishingReadiness(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        (args.accountType as MarketplaceAccountType) ?? "GRAND_KING",
      ),
  },
];
