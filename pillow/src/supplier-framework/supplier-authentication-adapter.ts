/** R2-01 — Supplier authentication adapter. */

import type { SupplierFrameworkConfiguration } from "./configuration.js";
import type { AuthenticationContext, AuthenticationResult } from "./types.js";

export class SupplierAuthenticationAdapter {
  authenticate(
    context: AuthenticationContext,
    config: SupplierFrameworkConfiguration,
  ): AuthenticationResult {
    if (context.method === "none") {
      return {
        authenticated: true,
        method: context.method,
        credentialRefPresent: false,
        tokenExposed: false,
        details: "No authentication required",
      };
    }

    const credentialRefPresent = Boolean(context.credentialRef);
    const authenticated = !config.validationRulesEnabled || credentialRefPresent;

    return {
      authenticated,
      method: context.method,
      credentialRefPresent,
      tokenExposed: false,
      details: authenticated
        ? "Supplier authentication validated (credential ref present)"
        : "Supplier authentication failed — credential reference missing",
    };
  }
}
