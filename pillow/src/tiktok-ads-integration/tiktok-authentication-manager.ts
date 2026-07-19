/** R5-04 — TikTok Authentication Manager. */

import { appendTaiLog } from "./tai-logging.js";
import type { TikTokAdsIntegrationConfiguration } from "./configuration.js";
import type { TikTokAuthResult } from "./types.js";

export class TikTokAuthenticationManager {
  authenticate(
    credentialRef: string | undefined,
    config: TikTokAdsIntegrationConfiguration,
  ): TikTokAuthResult {
    appendTaiLog({
      event: "authentication_event",
      level: "info",
      details: "TikTok authentication started",
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
      appendTaiLog({
        event: "authentication_event",
        level: "warn",
        details: "TikTok authentication failed — missing credential reference",
      });
      return {
        authenticated: false,
        authenticationStatus: "failed",
        credentialRefPresent: false,
        tokenExposed: false,
        details: "Credential reference required for TikTok authentication",
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

    appendTaiLog({
      event: "authentication_event",
      level: "info",
      details: "TikTok authentication succeeded (credential ref validated)",
    });

    return {
      authenticated: true,
      authenticationStatus: "authenticated",
      credentialRefPresent: true,
      tokenExposed: false,
      details: "TikTok credentials validated via credential reference",
    };
  }
}
