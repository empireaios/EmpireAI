import type { LiveCommerceSyncType } from "../models.js";

export interface LiveCommerceAdapterContext {
  workspaceId: string;
  providerId: string;
  credentials: Record<string, unknown>;
  mode: "sandbox" | "production";
}

export interface LiveCommerceValidationResult {
  valid: boolean;
  providerId: string;
  capabilities: string[];
  blockers: string[];
  liveApiVerified: boolean;
}

export interface LiveCommerceSyncResult {
  syncType: LiveCommerceSyncType;
  itemsProcessed: number;
  itemsFailed: number;
  liveApiVerified: boolean;
}

export interface LiveCommerceProviderAdapter {
  providerId: string;
  category: "marketplace" | "supplier";
  validateConnection(ctx: LiveCommerceAdapterContext): Promise<LiveCommerceValidationResult>;
  syncCatalog(ctx: LiveCommerceAdapterContext): Promise<LiveCommerceSyncResult>;
  syncInventory(ctx: LiveCommerceAdapterContext): Promise<LiveCommerceSyncResult>;
  syncPricing(ctx: LiveCommerceAdapterContext): Promise<LiveCommerceSyncResult>;
  syncOrders(ctx: LiveCommerceAdapterContext): Promise<LiveCommerceSyncResult>;
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
}
