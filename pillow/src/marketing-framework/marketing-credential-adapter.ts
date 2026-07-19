/** R5-01 — Marketing credential validation adapter. */

import type { MarketingFrameworkConfiguration } from "./configuration.js";
import type { CredentialContext, CredentialValidationResult } from "./types.js";

export class MarketingCredentialAdapter {
  validateCredentials(
    context: CredentialContext,
    config: MarketingFrameworkConfiguration,
  ): CredentialValidationResult {
    if (context.method === "none") {
      return {
        validated: true,
        method: context.method,
        credentialRefPresent: false,
        tokenExposed: false,
        details: "No credentials required",
      };
    }

    const credentialRefPresent = Boolean(context.credentialRef);
    const validated = !config.validationRulesEnabled || credentialRefPresent;

    return {
      validated,
      method: context.method,
      credentialRefPresent,
      tokenExposed: false,
      details: validated
        ? "Marketing credentials validated (credential ref present)"
        : "Marketing credential validation failed — credential reference missing",
    };
  }
}
