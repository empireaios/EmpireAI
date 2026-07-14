/** R1-01 — Authentication abstraction adapter. */

import { appendFrameworkLog } from "./mcf-logging.js";
import type { MarketplaceConnectorFrameworkConfiguration } from "./configuration.js";
import type { AuthenticationContext, AuthenticationResult } from "./types.js";

export class AuthenticationAdapter {
  authenticate(
    context: AuthenticationContext,
    config: MarketplaceConnectorFrameworkConfiguration,
  ): AuthenticationResult {
    appendFrameworkLog({
      event: "authentication_event",
      level: "info",
      details: `Auth check for ${context.marketplaceId} via ${context.method}`,
    });

    if (!config.authenticationRulesEnabled) {
      return {
        authenticated: true,
        method: context.method,
        credentialRefPresent: Boolean(context.credentialRef),
        tokenExposed: false,
        details: "Authentication rules disabled — structural pass only",
      };
    }

    if (context.method === "none") {
      return {
        authenticated: true,
        method: context.method,
        credentialRefPresent: false,
        tokenExposed: false,
        details: "No authentication required",
      };
    }

    const hasCredential = Boolean(context.credentialRef);
    return {
      authenticated: hasCredential,
      method: context.method,
      credentialRefPresent: hasCredential,
      tokenExposed: false,
      details: hasCredential
        ? "Credential reference present — token not exposed"
        : "Missing credential reference",
    };
  }
}
