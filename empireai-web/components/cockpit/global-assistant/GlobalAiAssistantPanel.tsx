"use client";

/**
 * Global Pillow entry — NO Float / Dock / Expand windowing.
 * Canonical conversation is the fixed Pillow Centre workspace only.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import { scrubMachineLanguage } from "@/lib/cockpit/executive/executive-presentation";

const PILLOW_CENTRE_HREF = "/cockpit/development/pillow?tab=conversation";

export function GlobalAiAssistantPanel() {
  const pathname = usePathname();
  const { executiveReady, readinessLabel, loading } = useGlobalAiAssistant();

  // On Pillow Centre the fixed workspace is the only chat — no duplicate shell.
  if (pathname?.startsWith("/cockpit/development/pillow")) {
    return null;
  }

  const status = !executiveReady
    ? scrubMachineLanguage(readinessLabel || "Starting")
    : loading
      ? "Working"
      : "Available";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 lg:bottom-6 lg:right-6">
      <Link
        href={PILLOW_CENTRE_HREF}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-[#0a0a0a]/95 px-4 py-2.5 text-sm text-[#f0d78c] shadow-lg shadow-black/40 hover:border-gold/50 hover:bg-[#121212]"
        aria-label="Open Pillow Centre conversation"
      >
        <span className="font-medium">Talk with Pillow</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            executiveReady && !loading
              ? "bg-emerald-500/15 text-emerald-200"
              : "bg-amber-500/15 text-amber-200"
          }`}
        >
          {status}
        </span>
      </Link>
    </div>
  );
}
