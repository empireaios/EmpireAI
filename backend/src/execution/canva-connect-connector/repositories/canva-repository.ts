import type { CanvaOAuthConnection, CanvaOAuthPending } from "../models/canva-records.js";

export interface CanvaRepository {
  savePending(pending: CanvaOAuthPending): CanvaOAuthPending;
  getPendingByState(state: string): CanvaOAuthPending | null;
  deletePending(pendingId: string): void;
  purgeExpiredPending(): void;
  saveConnection(connection: CanvaOAuthConnection): CanvaOAuthConnection;
  getConnection(workspaceId: string, companyId: string): CanvaOAuthConnection | null;
  revokeConnection(workspaceId: string, companyId: string): void;
}
