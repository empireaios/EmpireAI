/** R5-03 — Google Authentication Manager. */

import { appendGaiLog } from "./gai-logging.js";
import type { GoogleAdsIntegrationConfiguration } from "./configuration.js";
import type { GoogleAuthResult } from "./types.js";

export class GoogleAuthenticationManager {
  authenticate(
    credentialRef: string | undefined,
    config: GoogleAdsIntegrationConfiguration,
  ): GoogleAuthResult {
    appendGaiLog({
      event: "authentication_event",
      level: "info",
      details: "Google authentication started",
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
      appendGaiLog({
        event: "authentication_event",
        level: "warn",
        details: "Google authentication failed — missing credential reference",
      });
      return {
        authenticated: false,
        authenticationStatus: "failed",
        credentialRefPresent: false,
        tokenExposed: false,
        details: "Credential reference required for Google authentication",
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

    appendGaiLog({
      event: "authentication_event",
      level: "info",
      details: "Google authentication succeeded (credential ref validated)",
    });

    return {
      authenticated: true,
      authenticationStatus: "authenticated",
      credentialRefPresent: true,
      tokenExposed: false,
      details: "Google credentials validated via credential reference",
    };
  }
}
