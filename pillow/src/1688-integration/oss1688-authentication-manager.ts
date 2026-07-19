/** R2-04 — 1688 authentication manager. */

import { appendOssLog } from "./oss-logging.js";
import type { Oss1688IntegrationConfiguration } from "./configuration.js";
import type { Oss1688AuthResult } from "./types.js";

export class Oss1688AuthenticationManager {
  private sessionActive = false;
  private lastAuthAt: string | null = null;

  authenticate(
    credentialRef: string | null,
    config: Oss1688IntegrationConfiguration,
  ): Oss1688AuthResult {
    appendOssLog({
      event: "authentication_event",
      level: "info",
      details: "1688 API key authentication",
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
        ? "1688 session established via credential vault reference"
        : "Missing 1688 credential reference",
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
