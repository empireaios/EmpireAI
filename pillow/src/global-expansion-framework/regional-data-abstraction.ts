/** X4-01 — Scaling data abstraction layer. */

import { randomUUID } from "node:crypto";
import { appendGefLog } from "./gef-logging.js";
import type { GlobalModuleRegistry } from "./global-module-registry.js";
import type { GlobalExpansionFrameworkConfiguration } from "./configuration.js";
import type { AbstractedRegionalData, AbstractRegionalDataInput } from "./types.js";

const SENSITIVE_FIELDS =
  /(token|secret|password|api[_-]?key|authorization|credential|access[_-]?token)/i;

export class RegionalDataAbstractionLayer {
  constructor(private readonly registry: GlobalModuleRegistry) {}

  abstractData(
    input: AbstractRegionalDataInput,
    config: GlobalExpansionFrameworkConfiguration,
  ): AbstractedRegionalData {
    const record = this.registry.get(input.expansionModuleIdentifier);
    if (!record) {
      throw new Error(`Scaling module not registered: ${input.expansionModuleIdentifier}`);
    }
    if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      throw new Error(`Module not available in state: ${record.operationalState}`);
    }

    const dataId = `gef-data-${randomUUID()}`;
    const rawRef = input.payloadRef ?? `structural://regional-data/${dataId}`;
    const safePayloadRef =
      config.maskSensitiveValues && SENSITIVE_FIELDS.test(rawRef)
        ? "[redacted-payload-ref]"
        : rawRef;

    const fields = (input.fields ?? []).filter((f) => !SENSITIVE_FIELDS.test(f));

    appendGefLog({
      event: "regional_data_abstraction",
      level: "info",
      details: `Abstracted ${input.dataType} for ${input.expansionModuleIdentifier}`,
    });

    return {
      dataId,
      expansionModuleIdentifier: input.expansionModuleIdentifier,
      dataType: input.dataType,
      payloadRef: safePayloadRef,
      abstracted: true,
      fieldCount: fields.length,
      timestamp: new Date().toISOString(),
    };
  }
}
