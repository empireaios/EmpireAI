/** T1-08 — Sensitive content sanitization for visual memory. */

import type { VisualMemoryConfiguration } from "./configuration.js";

const MASK = "[REDACTED]";

export function isSensitiveField(
  fieldId: string | null | undefined,
  config: VisualMemoryConfiguration,
): boolean {
  if (!fieldId) return false;
  const lower = fieldId.toLowerCase();
  return config.sensitiveFieldPatterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

export function maskValue(
  value: string | null | undefined,
  fieldId: string | null | undefined,
  config: VisualMemoryConfiguration,
): { value: string | null; masked: boolean } {
  if (value === null || value === undefined) return { value: null, masked: false };
  if (!config.maskSensitiveValues) return { value, masked: false };
  if (isSensitiveField(fieldId, config)) return { value: MASK, masked: true };
  if (value.length > 512) return { value: `${value.slice(0, 64)}…[truncated]`, masked: false };
  return { value, masked: false };
}

export function sanitizeSerializedState(
  serialized: string,
  config: VisualMemoryConfiguration,
): { sanitized: string; maskedCount: number } {
  if (!config.maskSensitiveValues) return { sanitized: serialized, maskedCount: 0 };
  let maskedCount = 0;
  let sanitized = serialized;
  for (const pattern of config.sensitiveFieldPatterns) {
    const regex = new RegExp(
      `("${pattern}[^"]*":\\s*")([^"]*)(")`,
      "gi",
    );
    sanitized = sanitized.replace(regex, (_match, prefix, _value, suffix) => {
      maskedCount += 1;
      return `${prefix}${MASK}${suffix}`;
    });
  }
  return { sanitized, maskedCount };
}

export function sanitizeLabel(
  label: string | null,
  componentId: string,
  config: VisualMemoryConfiguration,
): { label: string | null; masked: boolean } {
  if (!label) return { label: null, masked: false };
  const result = maskValue(label, componentId, config);
  return { label: result.value, masked: result.masked };
}
