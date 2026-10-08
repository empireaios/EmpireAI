"use client";

import layout from "./PillowDesktopLayout.module.css";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { CockpitMobileNav } from "./CockpitMobileNav";
import { CockpitSidebar } from "./CockpitSidebar";
import { CockpitTopBar } from "./CockpitTopBar";
import { CockpitAuthGuard } from "./CockpitAuthGuard";
import { ExecutiveCommandStrip } from "@/components/cockpit/shell/ExecutiveCommandStrip";
import { CockpitInteractionProvider } from "@/lib/cockpit/interaction/CockpitInteractionProvider";
import { CockpitInteractionDrawer } from "@/components/cockpit/interaction/CockpitInteractionDrawer";
import { GlobalAiAssistantProvider } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import { GlobalAiAssistantPanel } from "@/components/cockpit/global-assistant/GlobalAiAssistantPanel";
import { CockpitRealtimeBridge } from "@/components/cockpit/ux/CockpitRealtimeBridge";
import { FounderShellProvider } from "@/lib/founder-shell/FounderShellProvider";

/** Keep main column clear of the fixed desktop sidebar. */
function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const sync = () => {
      try {
        setCollapsed(localStorage.getItem("empireai.cockpit.sidebarCollapsed") === "1");
      } catch {
        /* ignore */
      }
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("empireai:sidebar-collapsed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("empireai:sidebar-collapsed", sync);
    };
  }, []);
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("empireai.cockpit.sidebarCollapsed", next ? "1" : "0");
    } catch {
      // The visible layout still updates when browser storage is unavailable.
    }
    window.dispatchEvent(new Event("empireai:sidebar-collapsed"));
  };
  return { collapsed, toggle };
}

export function CockpitShell({ children }: { children: React.ReactNode }) {
  const sidebar = useSidebarState();
  const sidebarOffset = sidebar.collapsed ? "lg:pl-[72px]" : "lg:pl-64";
  const pathname = usePathname();
  const pillowPage = pathname === "/cockpit/development/pillow";
  if (pathname.startsWith("/cockpit/finance") || pathname === "/cockpit" || pathname === "/cockpit/assurance" || pathname === "/cockpit/assurance/mobile-acceptance" || pathname === "/cockpit/advisor" || pathname === "/cockpit/eyes" || pathname.startsWith("/cockpit/products") || pathname === "/cockpit/commerce/transactions") return <OwnerShell>{children}</OwnerShell>;
  return (
    <CockpitInteractionProvider>
      <CockpitAuthGuard>
        <FounderShellProvider>
          <GlobalAiAssistantProvider>
            <div className={`flex min-h-screen bg-[#030303] text-[#f5f0e6] ${pillowPage ? layout.shell : sidebarOffset}`}>
              {!pillowPage && <CockpitSidebar collapsed={sidebar.collapsed} onToggle={sidebar.toggle} />}
              <div className={`flex min-w-0 flex-1 flex-col pb-20 lg:min-h-0 lg:pb-0 ${pillowPage ? layout.content : ""}`}>
                <div className={pillowPage ? "lg:hidden" : undefined}><CockpitTopBar /></div>
                {!pillowPage && <ExecutiveCommandStrip />}
                <main
                  id="cockpit-main"
                  aria-label="Cockpit content"
                  data-scroll-owner="page"
                  className={`flex-1 overflow-x-clip px-4 py-6 lg:px-8 ${pillowPage ? layout.main : "lg:py-8"}`}
                >
                  {children}
                </main>
              </div>
              <CockpitMobileNav />
            </div>
            <CockpitInteractionDrawer />
            <CockpitRealtimeBridge />
            <GlobalAiAssistantPanel />
          </GlobalAiAssistantProvider>
        </FounderShellProvider>
      </CockpitAuthGuard>
    </CockpitInteractionProvider>
  );
}
