import type { UserAccount } from "./types.js";
export class AuthProtection {
  constructor(private readonly maxFailedAttempts: number, private readonly lockoutSeconds: number) {}
  canAuthenticate(account: UserAccount) { return account.accountStatus === "active" && (!account.authenticationSecurityState.lockedUntil || Date.parse(account.authenticationSecurityState.lockedUntil) <= Date.now()) && (!account.authenticationSecurityState.throttleUntil || Date.parse(account.authenticationSecurityState.throttleUntil) <= Date.now()); }
  recordFailure(account: UserAccount) {
    account.lastFailedLogin = new Date().toISOString(); account.authenticationSecurityState.failedAttempts += 1;
    if (account.authenticationSecurityState.failedAttempts >= this.maxFailedAttempts) { const until = new Date(Date.now() + this.lockoutSeconds * 1000).toISOString(); account.accountStatus = "locked"; account.authenticationSecurityState.lockedUntil = until; account.authenticationSecurityState.throttleUntil = until; }
  }
  recordSuccess(account: UserAccount) { account.lastSuccessfulLogin = new Date().toISOString(); account.authenticationSecurityState = { failedAttempts: 0, lockedUntil: null, throttleUntil: null }; if (account.accountStatus === "locked") account.accountStatus = "active"; }
}
