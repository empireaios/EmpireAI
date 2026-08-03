import { appendAuthAudit, getAuthAuditEvents } from "./atw-logging.js";
import { hashPassword, hashToken, verifyPassword, generateSecureToken } from "./crypto-utils.js";
import { AuthProtection } from "./auth-protection.js";
import { RecoveryManager } from "./recovery-manager.js";
import { SessionManager } from "./session-manager.js";
import { UserAccountStore } from "./user-account-store.js";
import type { AuthenticationWorkerConfiguration } from "./configuration.js";
import type { LoginInput, RegisterInput, ResetInput } from "./types.js";
const genericFailure = () => { throw new Error("Invalid credentials"); };
const requirePassword = (password: string) => { if (typeof password !== "string" || password.length < 10) throw new Error("Password must be at least 10 characters"); };
const GENERIC_RECOVERY_MESSAGE = "If an account exists, recovery instructions have been sent.";
export class AuthRuntime {
  readonly users = new UserAccountStore();
  readonly sessions: SessionManager;
  readonly recovery = new RecoveryManager();
  readonly protection: AuthProtection;
  private notify: ((input: Record<string, unknown>) => unknown) | null = null;
  constructor(private readonly configuration: AuthenticationWorkerConfiguration) {
    this.sessions = new SessionManager(configuration.sessionTtlSeconds);
    this.protection = new AuthProtection(configuration.maxFailedAttempts, configuration.lockoutSeconds);
  }
  setNotificationCapability(notify?: ((input: Record<string, unknown>) => unknown) | null) {
    this.notify = notify ?? null;
  }
  async registerAccount(input: RegisterInput) {
    requirePassword(input.password); if (!input.loginIdentifier?.trim()) throw new Error("loginIdentifier is required");
    const verificationToken = generateSecureToken(); const now = new Date().toISOString(); const userId = `atw-usr-${Date.now()}-${this.users.listPublic().length + 1}`;
    const user = this.users.create({ userId, loginIdentifier: input.loginIdentifier.trim(), verifiedStatus: "unverified", accountStatus: "active", passwordHash: await hashPassword(input.password), verificationTokenHash: hashToken(verificationToken), credentialMetadata: { algorithm: "scrypt", hashVersion: "v1", updatedAt: now }, sessionReferences: [], createdAt: now, updatedAt: now, lastSuccessfulLogin: null, lastFailedLogin: null, authenticationSecurityState: { failedAttempts: 0, lockedUntil: null, throttleUntil: null }, auditMetadata: { createdBy: "authentication-worker", events: 1 }, metadataVersion: "ATW-001-v1" });
    appendAuthAudit("account_registered", "success", userId, "account created"); return { user, verificationToken };
  }
  async login(input: LoginInput) {
    const account = this.users.getInternalByLogin(input.loginIdentifier ?? "");
    if (!account || !this.protection.canAuthenticate(account) || !await verifyPassword(input.password ?? "", account.passwordHash)) { if (account) { this.protection.recordFailure(account); this.users.update(account); } appendAuthAudit("login", "failure", account?.userId ?? null, "invalid credentials"); return genericFailure(); }
    this.protection.recordSuccess(account); const created = this.sessions.create(account.userId); account.sessionReferences = this.sessions.references(account.userId); account.updatedAt = new Date().toISOString(); this.users.update(account); appendAuthAudit("login", "success", account.userId, "opaque session created"); return { user: this.users.getPublic(account.userId)!, sessionId: created.session.sessionId, sessionToken: created.sessionToken, expiresAt: created.session.expiresAt };
  }
  logout(sessionToken: string) { const valid = this.sessions.validate(sessionToken); const revoked = this.sessions.revoke(sessionToken); appendAuthAudit("logout", revoked ? "success" : "failure", valid?.userId ?? null, revoked ? "session revoked" : "invalid session"); return { revoked }; }
  validateSession(sessionToken: string) { const session = this.sessions.validate(sessionToken); if (!session) throw new Error("Session invalid or expired"); return { sessionId: session.sessionId, userId: session.userId, expiresAt: session.expiresAt, status: session.status }; }
  renewSession(sessionToken: string) { const renewed = this.sessions.renew(sessionToken); if (!renewed) throw new Error("Session invalid or expired"); appendAuthAudit("session_renewed", "success", renewed.session.userId, "opaque session rotated"); return { sessionId: renewed.session.sessionId, sessionToken: renewed.sessionToken, expiresAt: renewed.session.expiresAt }; }
  revokeAllSessions(userId: string) { const count = this.sessions.revokeAll(userId); appendAuthAudit("sessions_revoked", "success", userId, `sessions=${count}`); return { revokedSessions: count }; }
  requestPasswordReset(loginIdentifier: string) {
    const account = this.users.getInternalByLogin(loginIdentifier);
    if (account) {
      const recoveryToken = this.recovery.request(account.userId);
      try {
        this.notify?.({
          type: "password_recovery",
          channel: "approved_notification_capability",
          userId: account.userId,
          recoveryToken,
        });
      } catch {
        /* notification optional — never leak account existence */
      }
    }
    appendAuthAudit("password_reset_requested", "info", account?.userId ?? null, "generic recovery request");
    return { message: GENERIC_RECOVERY_MESSAGE };
  }
  async resetPassword(input: ResetInput) { requirePassword(input.newPassword); const token = this.recovery.consume(input.recoveryToken); if (!token) throw new Error("Invalid or expired recovery token"); const account = this.users.getInternal(token.userId); if (!account) throw new Error("Invalid or expired recovery token"); account.passwordHash = await hashPassword(input.newPassword); account.credentialMetadata.updatedAt = new Date().toISOString(); account.updatedAt = account.credentialMetadata.updatedAt; this.users.update(account); this.sessions.revokeAll(account.userId); this.recovery.invalidateForUser(account.userId); appendAuthAudit("password_reset", "success", account.userId, "credentials replaced and sessions revoked"); return { reset: true }; }
  verifyAccount(input: { userId?: string; verificationToken: string }) { const tokenHash = hashToken(input.verificationToken); const account = input.userId ? this.users.getInternal(input.userId) : this.users.listPublic().map((item) => this.users.getInternal(item.userId)!).find((item) => item.verificationTokenHash === tokenHash); if (!account || account.verificationTokenHash !== tokenHash) throw new Error("Invalid verification token"); account.verifiedStatus = "verified"; account.verificationTokenHash = null; account.updatedAt = new Date().toISOString(); this.users.update(account); appendAuthAudit("account_verified", "success", account.userId, "account verified"); return this.users.getPublic(account.userId)!; }
  getPublicUser(userId: string) { return this.users.getPublic(userId); }
  getAuthAuditEvents(limit?: number) { return getAuthAuditEvents(limit); }
}
export const resetAuthRuntimeForTesting = () => {};
