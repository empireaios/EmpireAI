import { AUTH_METHODS_REQUIRING_CREDENTIAL } from "./paths.js";
import type { AuthMethod, ToolRegistration, ToolrtInput } from "./types.js";

export type AuthResult = {
  authStatus: "authenticated" | "rejected" | "skipped" | "refresh_structural";
  credentialReference: string | null;
  refreshTokenReference: string | null;
  notes: string[];
};

const CREDENTIAL_REF_PATTERN = /^cred:\/\/[A-Za-z0-9._\-/]+$/;

export class AuthManager {
  /**
   * Validate auth by credentialReference presence + method.
   * Returns authStatus without secrets. OAuth token refresh is structural only.
   */
  authenticate(tool: ToolRegistration, input: ToolrtInput = {}): AuthResult {
    const method = input.authMethod ?? tool.authMethod;
    const credentialReference = input.credentialReference ?? tool.credentialReference;

    if (method === "none") {
      return {
        authStatus: "skipped",
        credentialReference: null,
        refreshTokenReference: null,
        notes: ["authMethod none — no credential required"],
      };
    }

    if (this.requiresCredential(method)) {
      if (!credentialReference || !CREDENTIAL_REF_PATTERN.test(credentialReference)) {
        return {
          authStatus: "rejected",
          credentialReference: null,
          refreshTokenReference: null,
          notes: ["Missing or invalid credentialReference — secrets never accepted inline"],
        };
      }
    }

    if (method === "oauth" && input.refreshTokenReference) {
      if (!CREDENTIAL_REF_PATTERN.test(input.refreshTokenReference)) {
        return {
          authStatus: "rejected",
          credentialReference,
          refreshTokenReference: null,
          notes: ["refreshTokenReference must be a cred:// reference"],
        };
      }
      return {
        authStatus: "refresh_structural",
        credentialReference,
        refreshTokenReference: input.refreshTokenReference,
        notes: ["OAuth token refresh recorded structurally — no live token material"],
      };
    }

    return {
      authStatus: "authenticated",
      credentialReference,
      refreshTokenReference: null,
      notes: [`Authenticated via ${method} using credentialReference only`],
    };
  }

  requiresCredential(authMethod: AuthMethod): boolean {
    return (AUTH_METHODS_REQUIRING_CREDENTIAL as readonly string[]).includes(authMethod);
  }
}
