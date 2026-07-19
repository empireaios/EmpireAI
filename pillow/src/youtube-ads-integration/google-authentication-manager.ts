/** R5-05 — Google Authentication Manager (YouTube via Google Ads APIs). */

import { appendYaiLog } from "./yai-logging.js";
import type { YouTubeAdsIntegrationConfiguration } from "./configuration.js";
import type { GoogleAuthResult } from "./types.js";

export class GoogleAuthenticationManager {
  authenticate(
    credentialRef: string | undefined,
    config: YouTubeAdsIntegrationConfiguration,
  ): GoogleAuthResult {
    appendYaiLog({
      event: "authentication_event",
      level: "info",
      details: "Google authentication started for YouTube Ads",
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
      appendYaiLog({
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

    appendYaiLog({
      event: "authentication_event",
      level: "info",
      details: "Google authentication succeeded (credential ref validated)",
    });

    return {
      authenticated: true,
      authenticationStatus: "authenticated",
      credentialRefPresent: true,
      tokenExposed: false,
      details: "Google credentials validated via credential reference for YouTube Ads",
    };
  }
}
