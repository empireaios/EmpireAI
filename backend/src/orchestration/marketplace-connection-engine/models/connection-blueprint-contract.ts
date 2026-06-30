import type { MarketplaceId } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import type {
  MarketplaceAccountType,
  MarketplaceConnectionRecord,
} from "./marketplace-connection-record.js";

export type ConnectionBlueprintCapabilities = {
  oauthSupported: boolean;
  apiKeySupported: boolean;
  manualSetupRequired: boolean;
  unsupportedAutomationAreas: string[];
};

export type StartConnectionInput = {
  workspaceId: string;
  marketplaceId: MarketplaceId;
  accountType?: MarketplaceAccountType;
  actor: string;
};

export type CompleteConnectionInput = {
  workspaceId: string;
  marketplaceId: MarketplaceId;
  credentialsRef: string;
  grantedScopes?: string[];
  accountType?: MarketplaceAccountType;
  actor?: string;
  expiresAt?: string;
};

export type RefreshConnectionInput = {
  workspaceId: string;
  marketplaceId: MarketplaceId;
  accountType?: MarketplaceAccountType;
  actor?: string;
};

export type RevokeConnectionInput = {
  workspaceId: string;
  marketplaceId: MarketplaceId;
  accountType?: MarketplaceAccountType;
  actor?: string;
  reason?: string;
};

export type VerifyConnectionInput = {
  workspaceId: string;
  marketplaceId: MarketplaceId;
  accountType?: MarketplaceAccountType;
};

/** OAuth / API connection blueprint — no live OAuth implementation in LIVE-003. */
export interface MarketplaceConnectionBlueprint {
  marketplaceId: MarketplaceId;
  capabilities: ConnectionBlueprintCapabilities;
  startConnection(input: StartConnectionInput): MarketplaceConnectionRecord;
  completeConnection(input: CompleteConnectionInput): MarketplaceConnectionRecord;
  refreshConnection(input: RefreshConnectionInput): MarketplaceConnectionRecord;
  revokeConnection(input: RevokeConnectionInput): MarketplaceConnectionRecord;
  verifyConnection(input: VerifyConnectionInput): MarketplaceConnectionRecord;
  listConnectedMarketplaces(workspaceId: string, accountType?: MarketplaceAccountType): MarketplaceConnectionRecord[];
}
