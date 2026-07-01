/** PILLOW-019 — Executive Companion workspace context (mirrors backend schema). */
export type PillowWorkspaceContext = {
  screenPath: string;
  screenId: string;
  screenTitle: string;
  module?: string;
  workflow?: string;
  uxId?: string;
  purpose?: string;
  kpiLabel?: string | null;
  kpiValue?: string | null;
  pendingApprovals?: number;
  unreadNotifications?: number;
  navigationHistory?: string[];
  selectedRecords?: Array<{ type: string; id: string; label?: string }>;
  businessEntity?: Record<string, unknown>;
  extensionId?: string;
};

export type PillowPageContextOverride = Partial<
  Pick<
    PillowWorkspaceContext,
    | "workflow"
    | "selectedRecords"
    | "businessEntity"
    | "extensionId"
    | "module"
    | "screenTitle"
  >
>;
