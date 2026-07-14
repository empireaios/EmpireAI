import type { RegisteredTool } from "../../../brain/types.js";
import {
  disconnectCanvaAccount,
  exchangeCanvaOAuthCode,
  getCanvaHealthStatus,
  getCanvaOAuthStatus,
  getCanvaOAuthUrl,
} from "../services/canva-oauth-service.js";

/** Internal Canva OAuth tools — not for business-engine visual production (use visual_generation.*). */
export const canvaConnectTools: RegisteredTool[] = [
  {
    name: "canva.get_oauth_url",
    description: "Build Canva OAuth authorization URL with PKCE for Grand King account linking",
    module: "canva-connect-connector",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      getCanvaOAuthUrl({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
      }),
  },
  {
    name: "canva.exchange_oauth_code",
    description: "Exchange Canva OAuth authorization code and store encrypted tokens",
    module: "canva-connect-connector",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        code: { type: "string" },
        state: { type: "string" },
      },
      required: ["workspaceId", "companyId", "code", "state"],
    },
    handler: async (args) => {
      const connection = await exchangeCanvaOAuthCode({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        code: String(args.code),
        state: String(args.state),
      });
      return {
        connectionId: connection.connectionId,
        mock: connection.mock,
        scopes: connection.scopes,
      };
    },
  },
  {
    name: "canva.get_oauth_status",
    description: "Check Canva OAuth connection status",
    module: "canva-connect-connector",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) => {
      const connection = getCanvaOAuthStatus(
        String(args.workspaceId),
        String(args.companyId),
      );
      return {
        connected: Boolean(connection),
        mock: connection?.mock ?? false,
        scopes: connection?.scopes ?? [],
      };
    },
  },
  {
    name: "canva.disconnect",
    description: "Disconnect Grand King Canva account and revoke stored tokens",
    module: "canva-connect-connector",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) => {
      await disconnectCanvaAccount({
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
      });
      return { disconnected: true };
    },
  },
  {
    name: "canva.get_health",
    description: "Get Canva connector health and token validity status",
    module: "canva-connect-connector",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId", "companyId"],
    },
    handler: async (args) =>
      getCanvaHealthStatus(String(args.workspaceId), String(args.companyId)),
  },
];
