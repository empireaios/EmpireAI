/** X3-01 — Scaling data abstraction layer. */

import { randomUUID } from "node:crypto";
import { appendAsfLog } from "./asf-logging.js";
import type { ScalingModuleRegistry } from "./scaling-module-registry.js";
import type { AutonomousScalingFrameworkConfiguration } from "./configuration.js";
import type { AbstractedScalingData, AbstractScalingDataInput } from "./types.js";

const SENSITIVE_FIELDS =
  /(token|secret|password|api[_-]?key|authorization|credential|access[_-]?token)/i;

export class ScalingDataAbstractionLayer {
  constructor(private readonly registry: ScalingModuleRegistry) {}

  abstractData(
    input: AbstractScalingDataInput,
    config: AutonomousScalingFrameworkConfiguration,
  ): AbstractedScalingData {
    const record = this.registry.get(input.scalingModuleIdentifier);
    if (!record) {
      throw new Error(`Scaling module not registered: ${input.scalingModuleIdentifier}`);
    }
    if (record.operationalState !== "active" && record.operationalState !== "initialized") {
      throw new Error(`Module not available in state: ${record.operationalState}`);
    }

    const dataId = `asf-data-${randomUUID()}`;
    const rawRef = input.payloadRef ?? `structural://scaling-data/${dataId}`;
    const safePayloadRef =
      config.maskSensitiveValues && SENSITIVE_FIELDS.test(rawRef)
        ? "[redacted-payload-ref]"
        : rawRef;

    const fields = (input.fields ?? []).filter((f) => !SENSITIVE_FIELDS.test(f));

    appendAsfLog({
      event: "scaling_data_abstraction",
      level: "info",
      details: `Abstracted ${input.dataType} for ${input.scalingModuleIdentifier}`,
    });

    return {
      dataId,
      scalingModuleIdentifier: input.scalingModuleIdentifier,
      dataType: input.dataType,
      payloadRef: safePayloadRef,
      abstracted: true,
      fieldCount: fields.length,
      timestamp: new Date().toISOString(),
    };
  }
}
