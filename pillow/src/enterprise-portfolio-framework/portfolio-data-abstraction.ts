/** X2-01 — Portfolio data abstraction layer. */

import { randomUUID } from "node:crypto";
import { appendEpfLog } from "./epf-logging.js";
import type { PortfolioModuleRegistry } from "./portfolio-module-registry.js";
import type { EnterprisePortfolioFrameworkConfiguration } from "./configuration.js";
import type { AbstractedPortfolioData, AbstractPortfolioDataInput } from "./types.js";

const SENSITIVE_FIELDS =
  /(token|secret|password|api[_-]?key|authorization|credential|access[_-]?token)/i;

export class PortfolioDataAbstractionLayer {
  constructor(private readonly registry: PortfolioModuleRegistry) {}

  abstractData(
    input: AbstractPortfolioDataInput,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): AbstractedPortfolioData {
    const record = this.registry.get(input.portfolioModuleIdentifier);
    if (!record) {
      throw new Error(`Portfolio module not registered: ${input.portfolioModuleIdentifier}`);
    }
    if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      throw new Error(`Module not available in state: ${record.operationalState}`);
    }

    if (
      input.companyReference &&
      !record.registeredCompanies.includes(input.companyReference)
    ) {
      throw new Error(
        `Company ${input.companyReference} is not registered under ${input.portfolioModuleIdentifier}`,
      );
    }

    const dataId = `epf-data-${randomUUID()}`;
    const rawRef = input.payloadRef ?? `structural://portfolio-data/${dataId}`;
    const safePayloadRef =
      config.maskSensitiveValues && SENSITIVE_FIELDS.test(rawRef)
        ? "[redacted-payload-ref]"
        : rawRef;

    const fields = (input.fields ?? []).filter((f) => !SENSITIVE_FIELDS.test(f));

    appendEpfLog({
      event: "portfolio_data_abstraction",
      level: "info",
      details: `Abstracted ${input.dataType} for ${input.portfolioModuleIdentifier}`,
    });

    return {
      dataId,
      portfolioModuleIdentifier: input.portfolioModuleIdentifier,
      companyReference: input.companyReference ?? null,
      dataType: input.dataType,
      payloadRef: safePayloadRef,
      abstracted: true,
      fieldCount: fields.length,
      timestamp: new Date().toISOString(),
    };
  }
}
