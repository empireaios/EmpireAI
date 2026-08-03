export const ECA_STRUCTURAL_SAFETY_SIGNALS = {
  structuralSignalsOnly: true, neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
  neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance: true, preserveAllocationTraceability: true,
  preserveAuditability: true, preserveEnterpriseIntegrity: true, maskSensitiveValues: true,
  neverLogSensitiveFinancialInformation: true,
} as const;
