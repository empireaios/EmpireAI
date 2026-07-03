"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { brainDispatch } from "@/lib/brain/client";
import type {
  CockpitInteractionContext,
  CockpitInteractionIntent,
  CockpitInteractionResponse,
  CockpitInteractionTarget,
} from "@/lib/cockpit/interaction/types";

type CockpitInteractionState = {
  open: boolean;
  loading: boolean;
  context: CockpitInteractionContext | null;
  lastResponse: CockpitInteractionResponse | null;
  activeTarget: CockpitInteractionTarget | null;
};

type CockpitInteractionContextValue = CockpitInteractionState & {
  openDrawer: (target?: CockpitInteractionTarget) => void;
  closeDrawer: () => void;
  ask: (intent: CockpitInteractionIntent, target?: CockpitInteractionTarget) => Promise<void>;
  explainPanel: (label: string, targetId?: string, value?: string) => Promise<void>;
  explainAlert: (alertId: string, label: string) => Promise<void>;
  recommendNextAction: () => Promise<void>;
  refreshContext: () => Promise<void>;
};

const InteractionContext = createContext<CockpitInteractionContextValue | null>(null);

export function CockpitInteractionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<CockpitInteractionState>({
    open: false,
    loading: false,
    context: null,
    lastResponse: null,
    activeTarget: null,
  });

  const refreshContext = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const result = await brainDispatch<CockpitInteractionContext>({
        module: "cockpit-interaction",
        action: "context",
        payload: { screenPath: pathname },
      });
      setState((s) => ({
        ...s,
        loading: false,
        context: result.result ?? null,
      }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [pathname]);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  const ask = useCallback(
    async (intent: CockpitInteractionIntent, target?: CockpitInteractionTarget) => {
      setState((s) => ({
        ...s,
        open: true,
        loading: true,
        activeTarget: target ?? null,
      }));
      try {
        const result = await brainDispatch<CockpitInteractionResponse>({
          module: "cockpit-interaction",
          action: "explain",
          payload: {
            intent,
            screenPath: pathname,
            targetType: target?.targetType,
            targetId: target?.targetId,
            label: target?.label,
            value: target?.value,
          },
        });
        setState((s) => ({
          ...s,
          loading: false,
          lastResponse: result.result ?? null,
        }));
      } catch {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [pathname],
  );

  const explainPanel = useCallback(
    (label: string, targetId?: string, value?: string) =>
      ask("explain_panel", { targetType: "panel", targetId, label, value }),
    [ask],
  );

  const explainAlert = useCallback(
    (alertId: string, label: string) =>
      ask("explain_alert", { targetType: "alert", targetId: alertId, label }),
    [ask],
  );

  const recommendNextAction = useCallback(async () => {
    setState((s) => ({ ...s, open: true, loading: true, activeTarget: null }));
    try {
      const result = await brainDispatch<CockpitInteractionResponse>({
        module: "cockpit-interaction",
        action: "recommend",
        payload: { screenPath: pathname },
      });
      setState((s) => ({
        ...s,
        loading: false,
        lastResponse: result.result ?? null,
      }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [pathname]);

  const value = useMemo(
    () => ({
      ...state,
      openDrawer: (target?: CockpitInteractionTarget) =>
        setState((s) => ({ ...s, open: true, activeTarget: target ?? null })),
      closeDrawer: () => setState((s) => ({ ...s, open: false })),
      ask,
      explainPanel,
      explainAlert,
      recommendNextAction,
      refreshContext,
    }),
    [state, ask, explainPanel, explainAlert, recommendNextAction, refreshContext],
  );

  return <InteractionContext.Provider value={value}>{children}</InteractionContext.Provider>;
}

export function useCockpitInteraction() {
  const ctx = useContext(InteractionContext);
  if (!ctx) {
    throw new Error("useCockpitInteraction must be used within CockpitInteractionProvider");
  }
  return ctx;
}
