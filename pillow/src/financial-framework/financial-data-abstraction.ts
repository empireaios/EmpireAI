/** R3-01 — Financial data abstraction layer. */

import { randomUUID } from "node:crypto";
import { appendFrameworkLog } from "./ff-logging.js";
import type { FinancialModuleRegistry } from "./financial-module-registry.js";
import type { FinancialFrameworkConfiguration } from "./configuration.js";
import type { AbstractedFinancialData, AbstractFinancialDataInput } from "./types.js";

const SENSITIVE_FIELDS =
  /(token|secret|password|api[_-]?key|authorization|credential|account|iban|routing|card)/i;

export class FinancialDataAbstractionLayer {
  constructor(private readonly registry: FinancialModuleRegistry) {}

  abstractData(
    input: AbstractFinancialDataInput,
    _config: FinancialFrameworkConfiguration,
  ): AbstractedFinancialData {
    const record = this.registry.get(input.financialModuleIdentifier);
    if (!record) {
      throw new Error(`Financial module not registered: ${input.financialModuleIdentifier}`);
    }
    if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      throw new Error(`Module not available in state: ${record.operationalState}`);
    }

    const dataId = `ff-data-${randomUUID()}`;
    const safePayloadRef = SENSITIVE_FIELDS.test(input.payloadRef)
      ? "[redacted-payload-ref]"
      : input.payloadRef;

    appendFrameworkLog({
      event: "financial_data_abstraction",
      level: "info",
      details: `Abstracted ${input.dataType} for ${input.financialModuleIdentifier}`,
    });

    return {
      dataId,
      financialModuleIdentifier: input.financialModuleIdentifier,
      dataType: input.dataType,
      payloadRef: safePayloadRef,
      abstracted: true,
      fieldCount: 0,
      timestamp: new Date().toISOString(),
    };
  }
}
