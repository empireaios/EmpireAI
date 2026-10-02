/** Never seed or authenticate production accounts with public development credentials. */
export type BootstrapCredentialPolicyInput = {
  production: boolean;
  founderPassword?: string;
  adminPassword?: string;
};

const DEVELOPMENT_PASSWORD = "EmpireAI2026!";

export class UnsafeBootstrapCredentialsError extends Error {
  readonly code = "BOOTSTRAP_CREDENTIALS_UNSAFE";

  constructor() {
    super("Production bootstrap credentials require secure configuration");
    this.name = "UnsafeBootstrapCredentialsError";
  }
}

export function getBootstrapCredentialReadiness(input: BootstrapCredentialPolicyInput): {
  ready: boolean;
  unsafeAccounts: Array<"founder" | "admin">;
} {
  if (!input.production) return { ready: true, unsafeAccounts: [] };
  const unsafeAccounts: Array<"founder" | "admin"> = [];
  for (const [account, password] of [
    ["founder", input.founderPassword],
    ["admin", input.adminPassword],
  ] as const) {
    if (!password?.trim() || password.trim() === DEVELOPMENT_PASSWORD) unsafeAccounts.push(account);
  }
  return { ready: unsafeAccounts.length === 0, unsafeAccounts };
}

export function requireSafeBootstrapCredentials(input: BootstrapCredentialPolicyInput): void {
  if (!getBootstrapCredentialReadiness(input).ready) throw new UnsafeBootstrapCredentialsError();
}
