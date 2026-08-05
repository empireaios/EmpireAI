import type { ApiProviderRegistration, ApirtInput, ServiceType } from "./types.js";

export type PermissionResult = {
  permissionGranted: boolean;
  errors: string[];
  notes: string[];
};

export class PermissionGate {
  /**
   * Validate API permissions: pillowConfirmed, grandKingApproved, service allowlist.
   */
  check(
    provider: ApiProviderRegistration | null,
    input: ApirtInput,
  ): PermissionResult {
    const errors: string[] = [];
    const notes: string[] = [];

    if (input.pillowConfirmed !== true) {
      errors.push("pillowConfirmed=true required for API operations");
    }
    if (input.highRisk === true && input.grandKingApproved !== true) {
      errors.push("grandKingApproved=true required for high-risk API operations");
    }
    if (input.unauthorized === true) {
      errors.push("unauthorized operations are rejected");
    }

    if (provider && input.allowedServices && input.allowedServices.length > 0) {
      if (!input.allowedServices.includes(provider.serviceType as ServiceType)) {
        errors.push(
          `serviceType ${provider.serviceType} is not in the allowedServices allowlist`,
        );
      } else {
        notes.push(`serviceType ${provider.serviceType} allowed`);
      }
    }

    if (errors.length === 0) {
      notes.push("Permission gate passed");
    }

    return {
      permissionGranted: errors.length === 0,
      errors,
      notes,
    };
  }
}
