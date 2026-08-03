import type { PlatformCertificationInput } from "./types.js";
export function validateCertificationInput(input: PlatformCertificationInput = {}) {
  const rejected = [
    ["fabricateCertificationSuccess", input.fabricateCertificationSuccess], ["autoMarkComplete", input.autoMarkComplete],
    ["activateProduction", input.activateProduction], ["realBilling", input.realBilling],
    ["implementQ7OrLater", input.implementQ7OrLater], ["overridePillow", input.overridePillow], ["overrideGrandKing", input.overrideGrandKing],
  ].filter(([, value]) => value).map(([name]) => `${name} is forbidden by PILLOW-PFC-001`);
  if (input.missionId && input.missionId !== "Q6-15") rejected.push(`missionId ${input.missionId} is outside Q6-15`);
  return { valid: rejected.length === 0, errors: rejected };
}
