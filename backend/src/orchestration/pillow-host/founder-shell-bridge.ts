/** Collect live Founder Shell snapshot (P7-01). */
export function collectFounderShellSnapshot(input?: {
  shellHealth?: string | null;
  activeWorkspace?: string | null;
  navigationCount?: number;
}): {
  capturedAt: string;
  shellHealth: string | null;
  activeWorkspace: string | null;
  navigationCount: number;
} {
  return {
    capturedAt: new Date().toISOString(),
    shellHealth: input?.shellHealth ?? "healthy",
    activeWorkspace: input?.activeWorkspace ?? "executive_home",
    navigationCount: input?.navigationCount ?? 9,
  };
}
