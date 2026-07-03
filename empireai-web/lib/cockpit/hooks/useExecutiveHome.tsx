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
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import type { ExecutiveHomeView } from "@/lib/cockpit/panel-types";

const DEFAULT_REFRESH_MS = 45_000;

type ExecutiveHomeContextValue = {
  data: ExecutiveHomeView | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
  lastUpdatedAt: string | null;
  refreshMs: number;
};

const ExecutiveHomeContext = createContext<ExecutiveHomeContextValue | null>(null);

export function ExecutiveHomeProvider({
  children,
  refreshMs = DEFAULT_REFRESH_MS,
}: {
  children: ReactNode;
  refreshMs?: number;
}) {
  const { data, loading, error, reload } = useBrainModule<ExecutiveHomeView>("executive-home");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (data?.computedAt) {
      setLastUpdatedAt(data.computedAt);
    }
  }, [data?.computedAt]);

  useEffect(() => {
    if (refreshMs <= 0) return undefined;
    const timer = setInterval(() => reload(), refreshMs);
    return () => clearInterval(timer);
  }, [refreshMs, reload]);

  const value = useMemo(
    () => ({
      data,
      loading,
      error: error ? new Error(error.message) : null,
      reload,
      lastUpdatedAt,
      refreshMs,
    }),
    [data, loading, error, reload, lastUpdatedAt, refreshMs],
  );

  return (
    <ExecutiveHomeContext.Provider value={value}>{children}</ExecutiveHomeContext.Provider>
  );
}

export function useExecutiveHome() {
  const context = useContext(ExecutiveHomeContext);
  if (!context) {
    throw new Error("useExecutiveHome must be used within ExecutiveHomeProvider");
  }
  return context;
}

/** Optional hook for components outside Executive Home provider tree. */
export function useExecutiveHomeOptional() {
  return useContext(ExecutiveHomeContext);
}

export function useExecutiveHomeCard(cardId: string) {
  const { data, loading, error, reload, lastUpdatedAt } = useExecutiveHome();
  const card = data?.summaryCards.find((c) => c.id === cardId) ?? null;
  return { card, data, loading, error, reload, lastUpdatedAt };
}

export function useExecutiveHomeReload() {
  const { reload } = useExecutiveHome();
  return useCallback(() => reload(), [reload]);
}
