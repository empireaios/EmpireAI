"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { resolveCockpitCentreId } from "@/lib/cockpit-ux/navigation";
import { fetchWithBudget } from "@/lib/cockpit/fetch-with-budget";

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

/** Secondary awareness — must never block shell or stack 30s polls on hung Brain. */
const FETCH_TIMEOUT_MS = 12_000;
const POLL_MS = 60_000;

function resolveActiveNavId(pathname: string): string {
  return resolveCockpitCentreId(pathname);
}

export function FounderShellProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [data, setData] = useState<FounderShellContextPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      const res = await fetchWithBudget("/api/pillow/founder-shell", {
        credentials: "include",
        timeoutMs: FETCH_TIMEOUT_MS,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as FounderShellContextPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Founder Shell");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), POLL_MS);
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
