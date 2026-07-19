/** R5-02 — Meta Authentication Manager. */

import { appendMaiLog } from "./mai-logging.js";
import type { MetaAdsIntegrationConfiguration } from "./configuration.js";
import type { MetaAuthResult } from "./types.js";

export class MetaAuthenticationManager {
  authenticate(
    credentialRef: string | undefined,
    config: MetaAdsIntegrationConfiguration,
  ): MetaAuthResult {
    appendMaiLog({
      event: "authentication_event",
      level: "info",
      details: "Meta authentication started",
    });

    if (!config.authenticationRulesEnabled) {
      return {
        authenticated: true,
        authenticationStatus: "authenticated",
        credentialRefPresent: Boolean(credentialRef),
        tokenExposed: false,
        details: "Authentication rules disabled — structural pass",
      };
    }

    if (!credentialRef || credentialRef.trim().length === 0) {
      appendMaiLog({
        event: "authentication_event",
        level: "warn",
        details: "Meta authentication failed — missing credential reference",
      });
      return {
        authenticated: false,
        authenticationStatus: "failed",
        credentialRefPresent: false,
        tokenExposed: false,
        details: "Credential reference required for Meta authentication",
      };
    }

    if (!credentialRef.startsWith("vault://")) {
      return {
        authenticated: false,
        authenticationStatus: "failed",
        credentialRefPresent: true,
        tokenExposed: false,
        details: "Credential reference must use vault:// scheme",
      };
    }

    appendMaiLog({
      event: "authentication_event",
      level: "info",
      details: "Meta authentication succeeded (credential ref validated)",
    });

    return {
      authenticated: true,
      authenticationStatus: "authenticated",
      credentialRefPresent: true,
      tokenExposed: false,
      details: "Meta credentials validated via credential reference",
    };
  }
}
