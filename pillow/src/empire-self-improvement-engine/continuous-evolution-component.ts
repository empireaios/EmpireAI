/** Coordinates recovery recommendations only; destructive execution is forbidden. */
export class RecoveryCoordinationEngine { readonly neverExecuteDestructiveRecoveryActionsWithoutApprovedGovernance = true as const; }
