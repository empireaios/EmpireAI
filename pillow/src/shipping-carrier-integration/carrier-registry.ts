/** R2-11 — Carrier Registry. */

import { SUPPORTED_CARRIER_IDENTIFIERS } from "./paths.js";
import { CARRIER_NAMES } from "./carrier-fixtures.js";
import type { CarrierRegistration, SupportedCarrierIdentifier } from "./types.js";

export class CarrierRegistry {
  private carriers = new Map<SupportedCarrierIdentifier, CarrierRegistration>();

  register(carrierId: SupportedCarrierIdentifier, sessionId: string | null): CarrierRegistration {
    const registration: CarrierRegistration = {
      carrierId,
      carrierName: CARRIER_NAMES[carrierId],
      registeredAt: new Date().toISOString(),
      authenticated: sessionId !== null,
      sessionId,
    };
    this.carriers.set(carrierId, registration);
    return registration;
  }

  registerAll(): CarrierRegistration[] {
    return SUPPORTED_CARRIER_IDENTIFIERS.map((id) =>
      this.register(id, `sci-session-${id}-${Date.now()}`),
    );
  }

  get(carrierId: SupportedCarrierIdentifier): CarrierRegistration | undefined {
    return this.carriers.get(carrierId);
  }

  getAll(): CarrierRegistration[] {
    return [...this.carriers.values()];
  }

  isRegistered(carrierId: SupportedCarrierIdentifier): boolean {
    return this.carriers.has(carrierId);
  }

  resetForTesting(): void {
    this.carriers.clear();
  }
}
