export type VerifiedStatus = "unverified" | "verified";
export type AccountStatus = "active" | "locked" | "disabled" | "pending_verification";
export type CapabilityStatus = "implemented" | "partial" | "pending" | "failed";
export type PublicUserAccount = {
  userId: string; loginIdentifier: string; verifiedStatus: VerifiedStatus; accountStatus: AccountStatus;
  credentialMetadata: { algorithm: "scrypt"; hashVersion: string; updatedAt: string };
  sessionReferences: string[]; createdAt: string; updatedAt: string; lastSuccessfulLogin: string | null; lastFailedLogin: string | null;
  authenticationSecurityState: { failedAttempts: number; lockedUntil: string | null; throttleUntil: string | null };
  auditMetadata: { createdBy: string; events: number }; metadataVersion: string;
};
export type UserAccount = PublicUserAccount & { passwordHash: string; verificationTokenHash: string | null };
export type AuthSession = { sessionId: string; userId: string; tokenHash: string; expiresAt: string; createdAt: string; renewedAt: string | null; revokedAt: string | null; status: "active" | "revoked" | "expired" };
export type RecoveryToken = { recoveryId: string; userId: string; tokenHash: string; expiresAt: string; createdAt: string; usedAt: string | null };
export type AuthAuditEvent = { eventId: string; timestamp: string; type: string; userId: string | null; outcome: "success" | "failure" | "info"; details: string };
export type AuthenticationBuildReport = {
  buildId: string; timestamp: string; platformId: string | null; platformName: string | null; authenticationMethodsImplemented: string[];
  userAccountCapabilityStatus: CapabilityStatus; registrationStatus: CapabilityStatus; loginStatus: CapabilityStatus; logoutStatus: CapabilityStatus; sessionManagementStatus: CapabilityStatus; passwordSecurityStatus: CapabilityStatus; accountVerificationStatus: CapabilityStatus; recoveryFlowStatus: CapabilityStatus; authenticationProtectionStatus: CapabilityStatus; auditIntegrationStatus: CapabilityStatus;
  testsExecuted: string[]; buildStatus: "draft" | "in_progress" | "complete" | "failed"; outstandingIssues: string[]; confidenceScore: number; metadataVersion: string;
  requirementsReportId: string | null; architectureReportId: string | null; factoryMissionId: string | null; businessId: string | null; businessObjective: string | null;
  canonicalAuthReference: "backend/src/auth/"; passwordAlgorithm: "scrypt"; neverStorePlaintextPasswords: true; neverExposeSecretsInLogsOrReports: true; neverDefineRoles: true; neverDefinePermissions: true; neverBuildPolicyBasedAccessControl: true; neverImplementQ608OrLater: true; neverOverridePillow: true; neverOverrideGrandKing: true; neverOverrideApprovedArchitecture: true; followApprovedRequirementsAndArchitecture: true; preserveCompleteTraceability: true; keepAuthenticationSeparateFromAuthorization: true; preserveAuditHistory: true; failClosedWhenAuthStateUnverifiable: true; structuralSignalOnly: true; maskSensitiveValues: true;
  buildSteps: string[]; selfReviewPassed: boolean; selfReview: string[]; qualityReview: string; complianceReview: string; workerId: string; reportVersion: string; traceabilityRefs: string[]; preservedDecisions: string[]; submittedToExecutiveReporting: boolean; executiveReportId: string | null;
};
export type AuthenticationWorkerInput = { requirementsReportId?: string | null; architectureReportId?: string | null; factoryMissionId?: string | null; platformId?: string | null; platformName?: string | null; businessId?: string | null; businessObjective?: string | null; validated?: boolean; buildId?: string; defineRoles?: boolean; definePermissions?: boolean; buildPolicyBasedAccessControl?: boolean; overrideApprovedArchitecture?: boolean; overridePillow?: boolean; overrideGrandKing?: boolean; implementQ608OrLater?: boolean; storePlaintextPassword?: boolean; exposeSecrets?: boolean };
export type AuthenticationWorkerRunReport = { authenticationRunReportId: string; action: string; timestamp: string; latestAuthenticationBuildReport: AuthenticationBuildReport | null; authenticationBuildReports: AuthenticationBuildReport[]; validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] }; durationMs: number };
export type RegisterInput = { loginIdentifier: string; password: string; platformId?: string; validated?: boolean };
export type LoginInput = { loginIdentifier: string; password: string };
export type SessionInput = { sessionToken: string };
export type ResetInput = { recoveryToken: string; newPassword: string };
