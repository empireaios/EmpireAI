import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface GlobalAssistantContextValue {
  open: boolean;
  kpiLabel: string | null;
  kpiValue: string | null;
  openAssistant: (options?: { kpiLabel?: string; kpiValue?: string }) => void;
  closeAssistant: () => void;
  askWhy: (kpiLabel: string, kpiValue?: string) => void;
  screenPath: string;
}

const GlobalAssistantContext = createContext<GlobalAssistantContextValue | null>(null);

export function GlobalAssistantProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [kpiLabel, setKpiLabel] = useState<string | null>(null);
  const [kpiValue, setKpiValue] = useState<string | null>(null);

  const openAssistant = useCallback((options?: { kpiLabel?: string; kpiValue?: string }) => {
    setKpiLabel(options?.kpiLabel ?? null);
    setKpiValue(options?.kpiValue ?? null);
    setOpen(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setOpen(false);
  }, []);

  const askWhy = useCallback((label: string, value?: string) => {
    setKpiLabel(label);
    setKpiValue(value ?? null);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      open,
      kpiLabel,
      kpiValue,
      openAssistant,
      closeAssistant,
      askWhy,
      screenPath: location.pathname,
    }),
    [open, kpiLabel, kpiValue, openAssistant, closeAssistant, askWhy, location.pathname],
  );

  return <GlobalAssistantContext.Provider value={value}>{children}</GlobalAssistantContext.Provider>;
}

export function useGlobalAssistant() {
  const ctx = useContext(GlobalAssistantContext);
  if (!ctx) {
    throw new Error("useGlobalAssistant must be used within GlobalAssistantProvider");
  }
  return ctx;
}
