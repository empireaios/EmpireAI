/**
 * EKLS — Pillow ownership policy.
 * @see CANONICAL_EKLS_SPECIFICATION.md
 */

export const EKLS_OWNERSHIP_POLICY = {
  owner: "pillow" as const,
  orchestrationPolicy: "no_business_logic_in_ekls_gateway" as const,
  bypassForbidden: [
    "brain-direct-write",
    "engine-direct-ownership",
    "cockpit-source-of-truth",
    "registry-duplication",
    "guardian-governance",
  ] as const,
};

export type EklsForbiddenBypass = (typeof EKLS_OWNERSHIP_POLICY.bypassForbidden)[number];

export function isEklsOwnerPillow(owner: string): boolean {
  return owner === EKLS_OWNERSHIP_POLICY.owner;
}
