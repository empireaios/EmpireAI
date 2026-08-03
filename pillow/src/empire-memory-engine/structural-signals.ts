export const EME_STRUCTURAL_SAFETY_SIGNALS = {
  structuralSignalsOnly: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverAlterValidatedHistoricalRecordsWithoutAuthorization: true,
  preserveHistoricalTraceability: true,
  preserveAuditability: true,
  preserveEnterpriseIntegrity: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
} as const;
