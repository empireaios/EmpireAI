import type { ReactNode } from "react";
import { Panel } from "@/components/platform/ui/PlatformPrimitives";
import { CockpitActionButton } from "./CockpitActionButton";

/** G4-10 — Standard loading copy for Brain-backed panels. */
export function CockpitLoadingState({
  message = "Loading live data from Brain…",
}: {
  message?: string;
}) {
  return (
    <p className="text-sm text-[#8a847a]" role="status" aria-live="polite">
      {message}
    </p>
  );
}

/** G4-10 — Standard empty state. */
export function CockpitEmptyState({
  title = "Nothing to show",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-gold/10 bg-white/[0.02] px-4 py-6 text-center">
      <p className="text-sm font-medium text-[#c8c0b0]">{title}</p>
      {description && <p className="mt-1 text-xs text-[#6f6a60]">{description}</p>}
    </div>
  );
}

/** G4-10 — Standard error state with retry. */
export function CockpitErrorState({
  message = "Could not load this panel.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="space-y-3" role="alert">
      <p className="text-sm text-[#c8c0b0]">{message}</p>
      {onRetry && (
        <CockpitActionButton variant="secondary" onClick={onRetry}>
          Retry
        </CockpitActionButton>
      )}
    </div>
  );
}

/** Wrap platform Panel with standard loading / error / empty handling. */
export function CockpitPanelState({
  title,
  subtitle,
  loading,
  error,
  empty,
  emptyTitle,
  onRetry,
  children,
}: {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  onRetry?: () => void;
  children: ReactNode;
}) {
  return (
    <Panel title={title} subtitle={subtitle}>
      {loading && <CockpitLoadingState />}
      {!loading && error && <CockpitErrorState onRetry={onRetry} />}
      {!loading && !error && empty && (
        <CockpitEmptyState title={emptyTitle ?? "No data available"} />
      )}
      {!loading && !error && !empty && children}
    </Panel>
  );
}
