/** R2-11 — Carrier Authentication Manager. */

import type { SupportedCarrierIdentifier } from "./types.js";
import type { ShippingCarrierIntegrationConfiguration } from "./configuration.js";

export type CarrierSession = {
  sessionId: string;
  carrierId: SupportedCarrierIdentifier;
  authenticatedAt: string;
  expiresAt: string;
};

export class CarrierAuthenticationManager {
  private sessions = new Map<SupportedCarrierIdentifier, CarrierSession>();

  authenticate(input: {
    carrierId: SupportedCarrierIdentifier;
    config: ShippingCarrierIntegrationConfiguration;
  }): CarrierSession | null {
    if (!input.config.authenticationRulesEnabled) return null;

    const session: CarrierSession = {
      sessionId: `sci-auth-${input.carrierId}-${Date.now()}`,
      carrierId: input.carrierId,
      authenticatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
    this.sessions.set(input.carrierId, session);
    return session;
  }

  validateCredentials(carrierId: SupportedCarrierIdentifier): boolean {
    return this.sessions.has(carrierId);
  }

  getSession(carrierId: SupportedCarrierIdentifier): CarrierSession | undefined {
    return this.sessions.get(carrierId);
  }

  resetForTesting(): void {
    this.sessions.clear();
  }
}
