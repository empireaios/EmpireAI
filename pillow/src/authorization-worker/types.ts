export type AuthorizationEffect = "allow" | "deny";
export type EngineStatus = "idle" | "connecting" | "active" | "building" | "reporting" | "validating" | "failed";
export type Role = { roleId: string; name: string; description?: string; parentRoleId?: string; validated: boolean; createdAt: string };
export type Permission = { permissionId: string; name: string; resource: string; action: string; group?: string; validated: boolean; createdAt: string };
export type PolicyRule = { policyId: string; name: string; effect: AuthorizationEffect; roleId?: string; principalId?: string; permissionId?: string; resource: string; action: string; priority: number; validated: boolean; createdAt: string };
export type RoleAssignment = { assignmentId: string; principalId: string; roleId?: string; permissionId?: string; assignedBy?: string; createdAt: string };
export type AuthorizationDecision = { decisionId: string; principalId: string | null; resource: string; action: string; decision: AuthorizationEffect; reason: string; timestamp: string };
export type AuthorizationAuditEvent = { eventId: string; timestamp: string; type: string; principalId: string | null; outcome: "allow" | "deny" | "info"; details: string };
export type AuthorizationWorkerInput = {
  requirementsReportId?: string | null; architectureReportId?: string | null; factoryMissionId?: string | null; platformId?: string | null; platformName?: string | null; businessId?: string | null; businessObjective?: string | null; validated?: boolean;
  authenticateUser?: boolean; replaceAuthenticationWorker?: boolean; implementQ609OrLater?: boolean; overridePillow?: boolean; overrideGrandKing?: boolean; overrideApprovedArchitecture?: boolean;
};
export type CreateRoleInput = { roleId?: string; name: string; description?: string; parentRoleId?: string; validated?: boolean };
export type CreatePermissionInput = { permissionId?: string; name: string; resource: string; action: string; group?: string; validated?: boolean };
export type CreatePolicyInput = { policyId?: string; name: string; effect: AuthorizationEffect; roleId?: string; principalId?: string; permissionId?: string; resource: string; action: string; priority?: number; validated?: boolean };
export type AssignRoleInput = { principalId: string; roleId: string; assignedBy?: string };
export type AssignPermissionInput = { principalId: string; permissionId: string; assignedBy?: string };
export type EvaluateAccessInput = { principalId?: string; sessionToken?: string; resource: string; action: string };
export type AuthorizationBuildReport = {
  buildId: string; timestamp: string; platformId: string | null; platformName: string | null; rolesImplemented: string[]; permissionsImplemented: string[]; policiesImplemented: string[]; protectedResources: string[]; accessEvaluationResults: Array<Pick<AuthorizationDecision, "decision" | "reason" | "resource" | "action">>; auditIntegrationStatus: "implemented"; testResults: string[]; outstandingIssues: string[]; buildStatus: "draft" | "in_progress" | "complete" | "failed"; confidenceScore: number; metadataVersion: "AZW-001-v1";
  requirementsReportId: string | null; architectureReportId: string | null; factoryMissionId: string | null; businessId: string | null; businessObjective: string | null; canonicalAuthzReference: "backend/src/auth/permissions.ts"; defaultDeny: true; leastPrivilege: true; neverAuthenticateUsers: true; neverReplaceAuthenticationWorker: true; neverImplementQ609OrLater: true; neverOverridePillow: true; neverOverrideGrandKing: true; neverOverrideApprovedArchitecture: true; followApprovedRequirementsAndArchitecture: true; preserveCompleteTraceability: true; separateAuthenticationFromAuthorization: true; preventPrivilegeEscalation: true; preserveAuditHistory: true; maskSensitiveValues: true;
  buildSteps: string[]; selfReviewPassed: boolean; selfReview: string[]; workerId: string; reportVersion: "AZW-RPT-v1"; traceabilityRefs: string[]; submittedToExecutiveReporting: boolean; executiveReportId: string | null;
};
export type AuthorizationWorkerRunReport = { authorizationRunReportId: string; action: string; timestamp: string; latestAuthorizationBuildReport: AuthorizationBuildReport | null; authorizationBuildReports: AuthorizationBuildReport[]; validation: { decision: "pass" | "partial" | "fail"; errors: string[]; warnings: string[] }; durationMs: number };
