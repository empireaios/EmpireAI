/**
 * G8-05 — Authorization Centre Brain module contract.
 */

export const COCKPIT_AUTHORIZATION_CENTRE_MODULE_ID = "cockpit-authorization-centre" as const;

export type AuthorizationCentreCapability =
  | "authorization-centre.load"
  | "authorization-centre.load_detail"
  | "authorization-centre.attention"
  | "authorization-centre.execute_action";

export const AUTHORIZATION_CENTRE_CAPABILITIES: AuthorizationCentreCapability[] = [
  "authorization-centre.load",
  "authorization-centre.load_detail",
  "authorization-centre.attention",
  "authorization-centre.execute_action",
];

export type AuthorizationCentreModuleContract = {
  moduleId: typeof COCKPIT_AUTHORIZATION_CENTRE_MODULE_ID;
  capabilities: AuthorizationCentreCapability[];
  missionId: "G8-05";
  programmeStatus: "authorization-centre-cockpit-established";
  route: "/cockpit/operations/authorizations";
  screenId: "SCR-304";
  integratesWith: [
    "pillow",
    "brain",
    "registry",
    "ekls",
    "identity-authorization",
    "connection-registry",
    "authorization-framework",
    "credential-vault-integration",
    "connection-health-monitoring",
  ];
};

export function createAuthorizationCentreModuleContract(): AuthorizationCentreModuleContract {
  return {
    moduleId: COCKPIT_AUTHORIZATION_CENTRE_MODULE_ID,
    capabilities: AUTHORIZATION_CENTRE_CAPABILITIES,
    missionId: "G8-05",
    programmeStatus: "authorization-centre-cockpit-established",
    route: "/cockpit/operations/authorizations",
    screenId: "SCR-304",
    integratesWith: [
      "pillow",
      "brain",
      "registry",
      "ekls",
      "identity-authorization",
      "connection-registry",
      "authorization-framework",
      "credential-vault-integration",
      "connection-health-monitoring",
    ],
  };
}
