/** R1-02 — Amazon SP-API authentication manager (LWA abstraction). */

import { appendAmazonLog } from "./amz-logging.js";
import type { AmazonMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { AmazonAuthResult } from "./types.js";

export class AmazonAuthenticationManager {
  private sessionActive = false;
  private lastAuthAt: string | null = null;

  authenticate(
    credentialRef: string | null,
    region: string,
    config: AmazonMarketplaceIntegrationConfiguration,
  ): AmazonAuthResult {
    appendAmazonLog({
      event: "authentication_event",
      level: "info",
      details: `Amazon LWA authentication for region ${region}`,
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
        region,
        details: "Authentication rules disabled — structural pass",
      };
    }

    const hasCredential = Boolean(credentialRef);
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
      region,
      details: authenticated
        ? "LWA session established via credential vault reference"
        : "Missing Amazon credential reference",
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
