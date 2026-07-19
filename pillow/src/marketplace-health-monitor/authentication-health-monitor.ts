/** R1-14 — Authentication health monitor. */

import type { MarketplaceConnectorRecord } from "../marketplace-connector-framework/types.js";
import type { MarketplaceHealthFixture } from "./marketplace-health-fixtures.js";

export class AuthenticationHealthMonitor {
  assess(
    fixture: MarketplaceHealthFixture,
    connector: MarketplaceConnectorRecord | null,
  ): string {
    if (connector) {
      if (!connector.credentialRefPresent) return "unauthenticated";
      if (connector.currentState === "failed") return "failed";
      if (connector.currentState === "active" || connector.currentState === "initialized") {
        return "authenticated";
      }
      return connector.healthStatus === "failed" ? "failed" : "pending";
    }
    return fixture.authenticationStatus;
  }
}
