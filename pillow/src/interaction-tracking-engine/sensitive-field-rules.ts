/** T1-06 — Sensitive field detection and value masking. */

import type { InteractionTrackingConfiguration } from "./configuration.js";

const MASK = "[REDACTED]";

export function isSensitiveField(
  fieldId: string | null | undefined,
  config: InteractionTrackingConfiguration,
): boolean {
  if (!fieldId) return false;
  const lower = fieldId.toLowerCase();
  return config.sensitiveFieldPatterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

export function maskValue(
  value: string | null | undefined,
  fieldId: string | null | undefined,
  config: InteractionTrackingConfiguration,
): { value: string | null; masked: boolean } {
  if (value === null || value === undefined) return { value: null, masked: false };
  if (!config.maskSensitiveValues) return { value, masked: false };
  if (isSensitiveField(fieldId, config)) return { value: MASK, masked: true };
  if (value.length > 256) return { value: `${value.slice(0, 32)}…[truncated]`, masked: false };
  return { value, masked: false };
}

export function safeInputMetadata(
  fieldId: string | null,
  value: string | null,
  config: InteractionTrackingConfiguration,
): { previousValue: string | null; newValue: string | null; masked: boolean } {
  const prev = maskValue(value, fieldId, config);
  return {
    previousValue: prev.value,
    newValue: prev.value,
    masked: prev.masked,
  };
}
