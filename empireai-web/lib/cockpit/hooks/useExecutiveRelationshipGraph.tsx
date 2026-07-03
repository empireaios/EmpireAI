"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import type { ExecutiveRelationshipGraphView } from "@/lib/cockpit/panel-types";

const DEFAULT_REFRESH_MS = 60_000;

type ExecutiveRelationshipGraphContextValue = {
  data: ExecutiveRelationshipGraphView | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
  lastUpdatedAt: string | null;
};

const ExecutiveRelationshipGraphContext =
  createContext<ExecutiveRelationshipGraphContextValue | null>(null);

export function ExecutiveRelationshipGraphProvider({
  children,
  refreshMs = DEFAULT_REFRESH_MS,
}: {
  children: ReactNode;
  refreshMs?: number;
}) {
  const { data, loading, error, reload } =
    useBrainModule<ExecutiveRelationshipGraphView>("executive-relationship-graph");
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
    }),
    [data, loading, error, reload, lastUpdatedAt],
  );

  return (
    <ExecutiveRelationshipGraphContext.Provider value={value}>
      {children}
    </ExecutiveRelationshipGraphContext.Provider>
  );
}

export function useExecutiveRelationshipGraph() {
  const ctx = useContext(ExecutiveRelationshipGraphContext);
  if (!ctx) {
    throw new Error(
      "useExecutiveRelationshipGraph must be used within ExecutiveRelationshipGraphProvider",
    );
  }
  return ctx;
}
