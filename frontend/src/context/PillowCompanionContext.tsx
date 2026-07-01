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
import { useLocation } from "react-router-dom";

import { useGlobalAssistant } from "@/context/GlobalAssistantContext";
import { usePillowChat } from "@/hooks/usePillowChat";
import { buildPillowWorkspaceContext, resolvePillowScreenContext } from "@/lib/pillow-screen-context";
import type { PillowPageContextOverride, PillowWorkspaceContext } from "@/types/pillow-workspace-context";

interface PillowCompanionContextValue {
  open: boolean;
  workspaceContext: PillowWorkspaceContext;
  openCompanion: (options?: { kpiLabel?: string; kpiValue?: string }) => void;
  closeCompanion: () => void;
  toggleCompanion: () => void;
  setPageContext: (override: PillowPageContextOverride | null) => void;
  chat: ReturnType<typeof usePillowChat>;
}

const PillowCompanionContext = createContext<PillowCompanionContextValue | null>(null);

const NAV_HISTORY_MAX = 12;

export function PillowCompanionProvider({
  workspaceId,
  pendingApprovals = 0,
  unreadNotifications = 0,
  children,
}: {
  workspaceId: string;
  pendingApprovals?: number;
  unreadNotifications?: number;
  children: ReactNode;
}) {
  const location = useLocation();
  const { kpiLabel, kpiValue } = useGlobalAssistant();
  const [open, setOpen] = useState(false);
  const [pageOverride, setPageOverride] = useState<PillowPageContextOverride | null>(null);
  const [openKpi, setOpenKpi] = useState<{ label: string | null; value: string | null }>({
    label: null,
    value: null,
  });
  const navigationHistoryRef = useRef<string[]>([]);

  useEffect(() => {
    const path = location.pathname;
    const history = navigationHistoryRef.current;
    if (history[history.length - 1] !== path) {
      navigationHistoryRef.current = [...history, path].slice(-NAV_HISTORY_MAX);
    }
  }, [location.pathname]);

  const workspaceContext = useMemo(
    () =>
      buildPillowWorkspaceContext({
        screenPath: location.pathname,
        navigationHistory: navigationHistoryRef.current.map((path) => {
          const meta = resolvePillowScreenContext(path);
          return meta.screenTitle;
        }),
        kpiLabel: openKpi.label ?? kpiLabel,
        kpiValue: openKpi.value ?? kpiValue,
        pendingApprovals,
        unreadNotifications,
        pageOverride,
      }),
    [
      location.pathname,
      kpiLabel,
      kpiValue,
      openKpi,
      pendingApprovals,
      unreadNotifications,
      pageOverride,
    ],
  );

  const workspaceContextRef = useRef(workspaceContext);
  workspaceContextRef.current = workspaceContext;

  const chat = usePillowChat(workspaceId, {
    autoBootstrap: true,
    getWorkspaceContext: () => workspaceContextRef.current,
  });

  const openCompanion = useCallback((options?: { kpiLabel?: string; kpiValue?: string }) => {
    if (options?.kpiLabel) {
      setOpenKpi({ label: options.kpiLabel, value: options.kpiValue ?? null });
    }
    setOpen(true);
  }, []);

  const closeCompanion = useCallback(() => {
    setOpen(false);
    setOpenKpi({ label: null, value: null });
  }, []);

  const toggleCompanion = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const setPageContext = useCallback((override: PillowPageContextOverride | null) => {
    setPageOverride(override);
  }, []);

  const value = useMemo(
    () => ({
      open,
      workspaceContext,
      openCompanion,
      closeCompanion,
      toggleCompanion,
      setPageContext,
      chat,
    }),
    [open, workspaceContext, openCompanion, closeCompanion, toggleCompanion, setPageContext, chat],
  );

  return (
    <PillowCompanionContext.Provider value={value}>{children}</PillowCompanionContext.Provider>
  );
}

export function usePillowCompanion() {
  const ctx = useContext(PillowCompanionContext);
  if (!ctx) {
    throw new Error("usePillowCompanion must be used within PillowCompanionProvider");
  }
  return ctx;
}

/** Optional hook for extension pages to register structured context. */
export function usePillowPageContext(override: PillowPageContextOverride | null) {
  const { setPageContext } = usePillowCompanion();
  const serialized = JSON.stringify(override);
  useEffect(() => {
    setPageContext(override);
    return () => setPageContext(null);
  }, [serialized, setPageContext, override]);
}
