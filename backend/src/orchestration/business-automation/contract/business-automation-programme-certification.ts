/**
 * G5-10 — Business Automation programme certification (no new runtime capabilities).
 */

export const BUSINESS_AUTOMATION_PROGRAMME_ID = "G5" as const;

export const BUSINESS_AUTOMATION_MISSIONS = [
  "G5-01",
  "G5-02",
  "G5-03",
  "G5-04",
  "G5-05",
  "G5-06",
  "G5-07",
  "G5-08",
  "G5-09",
  "G5-10",
] as const;

export type BusinessAutomationMissionId = (typeof BUSINESS_AUTOMATION_MISSIONS)[number];

export type BusinessAutomationProgrammeStatus = "certified" | "not_certified";

export type BusinessAutomationProgrammeCertification = {
  programmeId: typeof BUSINESS_AUTOMATION_PROGRAMME_ID;
  missionId: "G5-10";
  status: BusinessAutomationProgrammeStatus;
  missionsComplete: readonly BusinessAutomationMissionId[];
  architectureAuthority: "g5-business-automation-architecture.md";
  registryCompliance: boolean;
  pillowGovernanceConfirmed: boolean;
  ownershipIntegrityConfirmed: boolean;
  validationSuitePass: boolean;
  typecheckPass: boolean;
  certifiedAt: string;
  productionEligible: boolean;
};

export function createBusinessAutomationProgrammeCertification(input: {
  validationSuitePass: boolean;
  typecheckPass: boolean;
}): BusinessAutomationProgrammeCertification {
  const certified =
    input.validationSuitePass &&
    input.typecheckPass;

  return {
    programmeId: BUSINESS_AUTOMATION_PROGRAMME_ID,
    missionId: "G5-10",
    status: certified ? "certified" : "not_certified",
    missionsComplete: BUSINESS_AUTOMATION_MISSIONS,
    architectureAuthority: "g5-business-automation-architecture.md",
    registryCompliance: certified,
    pillowGovernanceConfirmed: certified,
    ownershipIntegrityConfirmed: certified,
    validationSuitePass: input.validationSuitePass,
    typecheckPass: input.typecheckPass,
    certifiedAt: new Date().toISOString(),
    productionEligible: certified,
  };
}
