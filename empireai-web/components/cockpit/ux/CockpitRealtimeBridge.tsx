"use client";

import { useCallback } from "react";
import { useCockpitRealtime } from "@/lib/cockpit-ux/useCockpitRealtime";
import { useExecutiveHomeOptional } from "@/lib/cockpit/hooks/useExecutiveHome";
import { useFounderShellOptional } from "@/lib/founder-shell/FounderShellProvider";

/** Wires Brain SSE events to Executive Home + Founder Shell refresh (P7-02). */
export function CockpitRealtimeBridge() {
  const executiveHome = useExecutiveHomeOptional();
  const founderShell = useFounderShellOptional();

  const onRefresh = useCallback(() => {
    executiveHome?.reload();
    void founderShell?.refresh();
  }, [executiveHome, founderShell]);

  useCockpitRealtime({ onRefresh, enabled: Boolean(executiveHome || founderShell) });

  return null;
}
