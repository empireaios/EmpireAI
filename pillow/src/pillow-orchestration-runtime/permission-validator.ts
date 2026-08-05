import type { PillowOrchestrationRuntimeConfiguration } from "./configuration.js";
import type { PorInput } from "./types.js";

export type PermissionCheckResult = {
  permitted: boolean;
  blocked: boolean;
  reasons: string[];
};

export class PermissionValidator {
  validate(
    input: PorInput,
    config: PillowOrchestrationRuntimeConfiguration,
    context: { highRisk?: boolean; kind?: string } = {},
  ): PermissionCheckResult {
    const reasons: string[] = [];
    const highRisk = context.highRisk === true || input.highRisk === true;
    const kind = context.kind ?? "orchestration";

    if (config.requirePillowCommandConfirmation && input.pillowConfirmed !== true) {
      reasons.push("Pillow command confirmation required");
    }

    if (highRisk && config.requireGrandKingApproval && input.grandKingApproved !== true) {
      reasons.push(`Grand King approval required for high-risk ${kind}`);
    }

    if (input.bypassPillowGovernance === true) {
      reasons.push("Pillow governance bypass rejected");
    }

    if (input.bypassGrandKingApproval === true) {
      reasons.push("Grand King approval bypass rejected");
    }

    if (input.executeUnauthorisedActions === true) {
      reasons.push("Unauthorised action execution rejected");
    }

    const blocked = reasons.length > 0;
    return {
      permitted: !blocked,
      blocked,
      reasons,
    };
  }
}
