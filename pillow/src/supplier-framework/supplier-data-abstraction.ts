/** R2-01 — Supplier data abstraction layer. */

import { randomUUID } from "node:crypto";
import { appendFrameworkLog } from "./sf-logging.js";
import type { SupplierConnectorRegistry } from "./supplier-connector-registry.js";
import type { SupplierFrameworkConfiguration } from "./configuration.js";
import type { AbstractedSupplierData, AbstractSupplierDataInput } from "./types.js";

const SENSITIVE_FIELDS = /(token|secret|password|api[_-]?key|authorization|credential)/i;

export class SupplierDataAbstractionLayer {
  constructor(private readonly registry: SupplierConnectorRegistry) {}

  abstractData(
    input: AbstractSupplierDataInput,
    _config: SupplierFrameworkConfiguration,
  ): AbstractedSupplierData {
    const record = this.registry.get(input.supplierIdentifier);
    if (!record) {
      throw new Error(`Supplier connector not registered: ${input.supplierIdentifier}`);
    }
    if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      throw new Error(`Supplier not available in state: ${record.operationalState}`);
    }

    const dataId = `sf-data-${randomUUID()}`;
    const safePayloadRef = SENSITIVE_FIELDS.test(input.payloadRef)
      ? "[redacted-payload-ref]"
      : input.payloadRef;

    appendFrameworkLog({
      event: "supplier_data_abstraction",
      level: "info",
      details: `Abstracted ${input.dataType} for ${input.supplierIdentifier}`,
    });

    return {
      dataId,
      supplierIdentifier: input.supplierIdentifier,
      dataType: input.dataType,
      payloadRef: safePayloadRef,
      abstracted: true,
      fieldCount: 0,
      timestamp: new Date().toISOString(),
    };
  }
}
