import { generateSecureToken, hashToken } from "./crypto-utils.js";
import type { AuthSession } from "./types.js";
export class SessionManager {
  private readonly sessions = new Map<string, AuthSession>();
  constructor(private readonly ttlSeconds: number) {}
  create(userId: string) { const token = generateSecureToken(); const now = new Date(); const session: AuthSession = { sessionId: `atw-sess-${Date.now()}-${this.sessions.size + 1}`, userId, tokenHash: hashToken(token), createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + this.ttlSeconds * 1000).toISOString(), renewedAt: null, revokedAt: null, status: "active" }; this.sessions.set(session.tokenHash, session); return { session: { ...session }, sessionToken: token }; }
  validate(sessionToken: string) { if (!sessionToken || typeof sessionToken !== "string") return null; const session = this.sessions.get(hashToken(sessionToken)); if (!session || session.status !== "active") return null; if (Date.parse(session.expiresAt) <= Date.now()) { session.status = "expired"; return null; } return { ...session }; }
  renew(sessionToken: string) { const existing = this.validate(sessionToken); if (!existing) return null; const stored = this.sessions.get(existing.tokenHash)!; stored.status = "revoked"; stored.revokedAt = new Date().toISOString(); const result = this.create(existing.userId); const replacement = this.sessions.get(result.session.tokenHash)!; replacement.renewedAt = new Date().toISOString(); return result; }
  revoke(sessionToken: string) { const session = this.sessions.get(hashToken(sessionToken)); if (!session || session.status !== "active") return false; session.status = "revoked"; session.revokedAt = new Date().toISOString(); return true; }
  revokeAll(userId: string) { let count = 0; for (const session of this.sessions.values()) if (session.userId === userId && session.status === "active") { session.status = "revoked"; session.revokedAt = new Date().toISOString(); count += 1; } return count; }
  references(userId: string) { return [...this.sessions.values()].filter((session) => session.userId === userId && session.status === "active").map((session) => session.sessionId); }
}
