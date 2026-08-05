import type { ToolRegistration, ToolrtInput } from "./types.js";

export type PermissionResult = {
  permissionGranted: boolean;
  errors: string[];
  notes: string[];
};

export class PermissionGate {
  /**
   * Validate action against permissionPolicy + pillow/Grand King governance.
   */
  check(tool: ToolRegistration | null, input: ToolrtInput): PermissionResult {
    const errors: string[] = [];
    const notes: string[] = [];

    if (input.unauthorized === true) {
      errors.push("unauthorized operations are rejected");
    }

    if (!tool) {
      errors.push("tool required for permission check");
      return { permissionGranted: false, errors, notes };
    }

    const policy = tool.permissionPolicy;
    const action = input.action;

    if (action && !policy.allowedActions.includes(action)) {
      errors.push(
        `action "${action}" is not in allowedActions for tool ${tool.toolId}`,
      );
    }

    if (policy.requiresPillowConfirmation && input.pillowConfirmed !== true) {
      errors.push("pillowConfirmed=true required for tool operations");
    }

    const needsGrandKing =
      policy.highRisk ||
      policy.requiresGrandKingApproval ||
      input.highRisk === true;
    if (needsGrandKing && input.grandKingApproved !== true) {
      errors.push("grandKingApproved=true required for high-risk tool operations");
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
