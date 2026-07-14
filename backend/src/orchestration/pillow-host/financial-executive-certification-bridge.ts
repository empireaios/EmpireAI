import {
  assembleFinancialExecutiveCertification,
  buildFallbackFinancialExecutiveCertification,
} from "@empireai/pillow";

/** Fallback Financial Executive Certification when Pillow session is unavailable. */
export function collectFinancialExecutiveCertificationSnapshot() {
  return {
    computedAt: new Date().toISOString(),
    missionId: "E3-16",
    live: false,
    financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
  };
}

export { assembleFinancialExecutiveCertification, buildFallbackFinancialExecutiveCertification };
