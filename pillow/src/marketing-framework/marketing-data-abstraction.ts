/** R5-01 — Marketing data abstraction layer. */

import { randomUUID } from "node:crypto";
import { appendFrameworkLog } from "./mfw-logging.js";
import type { MarketingModuleRegistry } from "./marketing-module-registry.js";
import type { MarketingFrameworkConfiguration } from "./configuration.js";
import type { AbstractedMarketingData, AbstractMarketingDataInput } from "./types.js";

const SENSITIVE_FIELDS =
  /(token|secret|password|api[_-]?key|authorization|credential|ad[_-]?account|pixel|campaign[_-]?secret)/i;

export class MarketingDataAbstractionLayer {
  constructor(private readonly registry: MarketingModuleRegistry) {}

  abstractData(
    input: AbstractMarketingDataInput,
    _config: MarketingFrameworkConfiguration,
  ): AbstractedMarketingData {
    const record = this.registry.get(input.marketingModuleIdentifier);
    if (!record) {
      throw new Error(`Marketing module not registered: ${input.marketingModuleIdentifier}`);
    }
    if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      throw new Error(`Module not available in state: ${record.operationalState}`);
    }

    const dataId = `mfw-data-${randomUUID()}`;
    const safePayloadRef = SENSITIVE_FIELDS.test(input.payloadRef)
      ? "[redacted-payload-ref]"
      : input.payloadRef;

    appendFrameworkLog({
      event: "marketing_data_abstraction",
      level: "info",
      details: `Abstracted ${input.dataType} for ${input.marketingModuleIdentifier}`,
    });

    return {
      dataId,
      marketingModuleIdentifier: input.marketingModuleIdentifier,
      dataType: input.dataType,
      payloadRef: safePayloadRef,
      abstracted: true,
      fieldCount: 0,
      timestamp: new Date().toISOString(),
    };
  }
}
