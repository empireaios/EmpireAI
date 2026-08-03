import type { PublicUserAccount, UserAccount } from "./types.js";
const publicView = (account: UserAccount): PublicUserAccount => {
  const { passwordHash: _passwordHash, verificationTokenHash: _verificationTokenHash, ...view } = account;
  return structuredClone(view);
};
export class UserAccountStore {
  private readonly byId = new Map<string, UserAccount>(); private readonly byLogin = new Map<string, string>();
  create(account: UserAccount) { if (this.byLogin.has(account.loginIdentifier.toLowerCase())) throw new Error("Account already exists"); this.byId.set(account.userId, account); this.byLogin.set(account.loginIdentifier.toLowerCase(), account.userId); return publicView(account); }
  getInternalByLogin(loginIdentifier: string) { const id = this.byLogin.get(loginIdentifier.toLowerCase()); return id ? this.byId.get(id) ?? null : null; }
  getInternal(userId: string) { return this.byId.get(userId) ?? null; }
  getPublic(userId: string) { const account = this.byId.get(userId); return account ? publicView(account) : null; }
  update(account: UserAccount) { this.byId.set(account.userId, account); return publicView(account); }
  listPublic() { return [...this.byId.values()].map(publicView); }
}
