/**
 * G8-02 — Authorization Framework Brain module contract.
 */

export const AUTHORIZATION_FRAMEWORK_MODULE_ID = "authorization-framework" as const;

export type AuthorizationFrameworkCapability =
  | "authorization-framework.start"
  | "authorization-framework.callback"
  | "authorization-framework.submit"
  | "authorization-framework.validate"
  | "authorization-framework.status"
  | "authorization-framework.cancel"
  | "authorization-framework.requirements";

export const AUTHORIZATION_FRAMEWORK_CAPABILITIES: AuthorizationFrameworkCapability[] = [
  "authorization-framework.start",
  "authorization-framework.callback",
  "authorization-framework.submit",
  "authorization-framework.validate",
  "authorization-framework.status",
  "authorization-framework.cancel",
  "authorization-framework.requirements",
];

export type AuthorizationFrameworkModuleContract = {
  moduleId: typeof AUTHORIZATION_FRAMEWORK_MODULE_ID;
  capabilities: AuthorizationFrameworkCapability[];
  missionId: "G8-02";
  programmeStatus: "oauth-api-authorization-framework-established";
  integratesWith: ["pillow", "brain", "registry", "ekls", "connection-registry", "identity-authorization"];
};

export function createAuthorizationFrameworkModuleContract(): AuthorizationFrameworkModuleContract {
  return {
    moduleId: AUTHORIZATION_FRAMEWORK_MODULE_ID,
    capabilities: AUTHORIZATION_FRAMEWORK_CAPABILITIES,
    missionId: "G8-02",
    programmeStatus: "oauth-api-authorization-framework-established",
    integratesWith: ["pillow", "brain", "registry", "ekls", "connection-registry", "identity-authorization"],
  };
}
