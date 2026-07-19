/** X1-01 — Marketing data abstraction layer. */

import { randomUUID } from "node:crypto";
import { appendFrameworkLog } from "./cff-logging.js";
import type { CompanyModuleRegistry } from "./company-module-registry.js";
import type { CompanyFactoryFrameworkConfiguration } from "./configuration.js";
import type { AbstractedCompanyData, AbstractCompanyDataInput } from "./types.js";

const SENSITIVE_FIELDS =
  /(token|secret|password|api[_-]?key|authorization|credential|ad[_-]?account|pixel|campaign[_-]?secret)/i;

export class CompanyDataAbstractionLayer {
  constructor(private readonly registry: CompanyModuleRegistry) {}

  abstractData(
    input: AbstractCompanyDataInput,
    _config: CompanyFactoryFrameworkConfiguration,
  ): AbstractedCompanyData {
    const record = this.registry.get(input.companyModuleIdentifier);
    if (!record) {
      throw new Error(`Company module not registered: ${input.companyModuleIdentifier}`);
    }
    if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      throw new Error(`Module not available in state: ${record.operationalState}`);
    }

    const dataId = `cff-data-${randomUUID()}`;
    const safePayloadRef = SENSITIVE_FIELDS.test(input.payloadRef)
      ? "[redacted-payload-ref]"
      : input.payloadRef;

    appendFrameworkLog({
      event: "company_data_abstraction",
      level: "info",
      details: `Abstracted ${input.dataType} for ${input.companyModuleIdentifier}`,
    });

    return {
      dataId,
      companyModuleIdentifier: input.companyModuleIdentifier,
      dataType: input.dataType,
      payloadRef: safePayloadRef,
      abstracted: true,
      fieldCount: 0,
      timestamp: new Date().toISOString(),
    };
  }
}
