/** R3-01 — Financial credential validation adapter. */

import type { FinancialFrameworkConfiguration } from "./configuration.js";
import type { CredentialContext, CredentialValidationResult } from "./types.js";

export class FinancialCredentialAdapter {
  validateCredentials(
    context: CredentialContext,
    config: FinancialFrameworkConfiguration,
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
        ? "Financial credentials validated (credential ref present)"
        : "Financial credential validation failed — credential reference missing",
    };
  }
}
