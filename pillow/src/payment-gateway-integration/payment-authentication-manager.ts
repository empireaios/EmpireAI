/** R3-02 — Payment authentication manager. */

import { appendPgLog } from "./pg-logging.js";
import type { PaymentGatewayIntegrationConfiguration } from "./configuration.js";
import type { PaymentAuthResult } from "./types.js";

export class PaymentAuthenticationManager {
  private sessionActive = false;
  private lastAuthAt: string | null = null;

  authenticate(
    credentialRef: string | null,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentAuthResult {
    appendPgLog({
      event: "authentication_event",
      level: "info",
      details: "Payment gateway API authentication",
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
        ? "Payment gateway session established via credential vault reference"
        : "Missing payment gateway credential reference",
    };
  }

  validateCredentials(credentialRef: string | null): boolean {
    return Boolean(credentialRef?.startsWith("vault://"));
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
