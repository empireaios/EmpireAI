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
import { resolveCockpitCentreId } from "@/lib/cockpit-ux/navigation";

type FounderShellContextPayload = {
  founderShellEngine: {
    computedAt: string;
    cockpit: {
      shellHealth: string;
      activeWorkspace: string;
      context: {
        currentBusiness: string | null;
        currentMission: string | null;
        currentJourney: string | null;
        currentNotifications: number;
        currentRecommendations: string[];
        currentWorkspace: string;
      };
      executiveHome: {
        businessStatus: string;
        missionStatus: string;
        builderStatus: string;
        supervisorStatus: string;
        productionStatus: string;
        revenue: string;
        alerts: string[];
        recommendations: string[];
        currentJourney: string;
        pendingActions: string[];
      };
      grandKingSummary: string;
    };
  };
};

type FounderShellContextValue = {
  loading: boolean;
  error: string | null;
  data: FounderShellContextPayload | null;
  activeNavId: string;
  refresh: () => Promise<void>;
};

const FounderShellContext = createContext<FounderShellContextValue | null>(null);

function resolveActiveNavId(pathname: string): string {
  return resolveCockpitCentreId(pathname);
}

export function FounderShellProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [data, setData] = useState<FounderShellContextPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/founder-shell", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as FounderShellContextPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Founder Shell");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const activeNavId = useMemo(() => resolveActiveNavId(pathname), [pathname]);

  const value = useMemo(
    () => ({ loading, error, data, activeNavId, refresh }),
    [loading, error, data, activeNavId, refresh],
  );

  return (
    <FounderShellContext.Provider value={value}>{children}</FounderShellContext.Provider>
  );
}

export function useFounderShell() {
  const ctx = useContext(FounderShellContext);
  if (!ctx) {
    throw new Error("useFounderShell must be used within FounderShellProvider");
  }
  return ctx;
}

export function useFounderShellOptional() {
  return useContext(FounderShellContext);
}
