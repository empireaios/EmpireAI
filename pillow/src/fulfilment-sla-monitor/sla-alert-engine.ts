/** R2-18 — SLA Alert Engine. */

import type { FulfilmentSlaMonitorConfiguration } from "./configuration.js";
import type { ComplianceStatus, SlaAlertType } from "./types.js";

export class SlaAlertEngine {
  generateAlerts(input: {
    complianceStatus: ComplianceStatus;
    supplierCompliant: boolean;
    carrierCompliant: boolean;
    fulfilmentFailed: boolean;
    config: FulfilmentSlaMonitorConfiguration;
  }): string[] {
    if (!input.config.alertRulesEnabled) return [];

    const alerts: SlaAlertType[] = [];
    if (input.complianceStatus === "breached") {
      alerts.push("fulfilment_breach", "shipment_breach");
    } else if (input.complianceStatus === "at_risk") {
      alerts.push("sla_risk");
    }
    if (!input.supplierCompliant) alerts.push("supplier_non_compliance");
    if (!input.carrierCompliant) alerts.push("carrier_non_compliance");
    if (input.fulfilmentFailed && !alerts.includes("fulfilment_breach")) {
      alerts.push("fulfilment_breach");
    }

    return [...new Set(alerts)];
  }
}
