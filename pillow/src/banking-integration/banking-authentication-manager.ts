/** R3-03 — Banking authentication manager. */

import { appendBiLog } from "./bi-logging.js";
import type { BankingIntegrationConfiguration } from "./configuration.js";
import type { BankingAuthResult } from "./types.js";

export class BankingAuthenticationManager {
  private sessionActive = false;
  private lastAuthAt: string | null = null;

  authenticate(
    credentialRef: string | null,
    config: BankingIntegrationConfiguration,
  ): BankingAuthResult {
    appendBiLog({
      event: "banking_authentication",
      level: "info",
      details: "Banking API authentication",
    });

    if (!config.authenticationRulesEnabled) {
      this.sessionActive = true;
      this.lastAuthAt = new Date().toISOString();
      return {
        authenticated: true,
        authenticationStatus: "authenticated",
        sessionStatus: "active",
        credentialRefPresent: Boolean(credentialRef),
        tokenExposed: false,
        details: "Authentication rules disabled — structural pass",
      };
    }

    const hasCredential = Boolean(credentialRef?.startsWith("vault://"));
    const authenticated = hasCredential;

    if (authenticated) {
      this.sessionActive = true;
      this.lastAuthAt = new Date().toISOString();
    }

    return {
      authenticated,
      authenticationStatus: authenticated ? "authenticated" : "failed",
      sessionStatus: authenticated ? "active" : "failed",
      credentialRefPresent: hasCredential,
      tokenExposed: false,
      details: authenticated
        ? "Banking session established via credential vault reference"
        : "Missing banking credential reference",
    };
  }

  getSessionStatus(): "none" | "active" | "expired" | "failed" {
    if (!this.sessionActive) return "none";
    if (!this.lastAuthAt) return "none";
    const age = Date.now() - new Date(this.lastAuthAt).getTime();
    if (age > 3600000) return "expired";
    return "active";
  }

  resetForTesting(): void {
    this.sessionActive = false;
    this.lastAuthAt = null;
  }
}
