export const EOE_STRUCTURAL_SAFETY_SIGNALS = {
  structuralSignalsOnly: true, neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
  neverExecuteUnapprovedOptimizationActionsAutomatically: true, preserveOptimizationTraceability: true,
  preserveAuditability: true, preserveEnterpriseIntegrity: true, maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
} as const;
