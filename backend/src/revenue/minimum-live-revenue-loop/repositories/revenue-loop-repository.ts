import type { LiveStoreConfig } from "../models/live-store-config.js";
import type { RevenueOrderRecord } from "../models/revenue-order-record.js";

export type LiveStoreRecord = LiveStoreConfig & {
  recordId: string;
  createdAt: string;
  updatedAt: string;
};

export interface RevenueLoopRepository {
  saveStore(store: LiveStoreRecord): LiveStoreRecord;
  getStoreBySlug(slug: string): LiveStoreRecord | null;
  getStoreById(storeId: string): LiveStoreRecord | null;
  listStores(workspaceId: string): LiveStoreRecord[];

  saveOrder(order: RevenueOrderRecord): RevenueOrderRecord;
  getOrderById(recordId: string): RevenueOrderRecord | null;
  getOrderByStripeSession(sessionId: string): RevenueOrderRecord | null;
  listOrders(workspaceId: string, storeId?: string): RevenueOrderRecord[];
}
