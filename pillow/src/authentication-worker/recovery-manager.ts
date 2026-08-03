import { generateSecureToken, hashToken } from "./crypto-utils.js";
import type { RecoveryToken } from "./types.js";
export class RecoveryManager {
  private readonly tokens = new Map<string, RecoveryToken>();
  request(userId: string) { const token = generateSecureToken(); const item: RecoveryToken = { recoveryId: `atw-tok-${Date.now()}-${this.tokens.size + 1}`, userId, tokenHash: hashToken(token), createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(), usedAt: null }; this.tokens.set(item.tokenHash, item); return token; }
  consume(token: string) { const item = this.tokens.get(hashToken(token)); if (!item || item.usedAt || Date.parse(item.expiresAt) <= Date.now()) return null; item.usedAt = new Date().toISOString(); return { ...item }; }
  invalidateForUser(userId: string) { for (const item of this.tokens.values()) if (item.userId === userId && !item.usedAt) item.usedAt = new Date().toISOString(); }
}
