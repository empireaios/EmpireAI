/**
 * G8-00 — Identity platform health registration.
 */

import { IDENTITY_AUTHORIZATION_MODULE_ID } from "../contract/identity-authorization-module.js";
import { validateIdentityAuthorizationPillowGovernance } from "../governance/identity-authorization-pillow-governance.js";

export type IdentityPlatformHealthProbe = {
  moduleId: typeof IDENTITY_AUTHORIZATION_MODULE_ID;
  probeId: "identity-platform-foundation-health";
  label: string;
  registeredAt: string;
  workspaceId: string;
  pillowGoverned: true;
};

let registeredProbe: IdentityPlatformHealthProbe | undefined;

export function registerIdentityPlatformHealthProbe(input: {
  workspaceId: string;
  actorId: string;
  ownerId: string;
  pillowGovernance: true;
}): { registered: boolean; probe?: IdentityPlatformHealthProbe; reason: string } {
  const governance = validateIdentityAuthorizationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "overview",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { registered: false, reason: governance.reason };
  }

  registeredProbe = {
    moduleId: IDENTITY_AUTHORIZATION_MODULE_ID,
    probeId: "identity-platform-foundation-health",
    label: "Identity & Authorization Platform foundation health",
    registeredAt: new Date().toISOString(),
    workspaceId: input.workspaceId,
    pillowGoverned: true,
  };

  return { registered: true, probe: registeredProbe, reason: "Identity platform health probe registered" };
}

export function getIdentityPlatformHealthProbe(): IdentityPlatformHealthProbe | undefined {
  return registeredProbe;
}

export function listIdentityPlatformHealthProbes(): IdentityPlatformHealthProbe[] {
  return registeredProbe ? [registeredProbe] : [];
}

export function resetIdentityPlatformHealthRegistrationForTests(): void {
  registeredProbe = undefined;
}
