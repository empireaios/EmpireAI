import { CockpitMobileNav } from "./CockpitMobileNav";
import { CockpitSidebar } from "./CockpitSidebar";
import { CockpitTopBar } from "./CockpitTopBar";
import { CockpitAuthGuard } from "./CockpitAuthGuard";
import { ExecutiveCommandStrip } from "@/components/cockpit/shell/ExecutiveCommandStrip";
import { CockpitInteractionProvider } from "@/lib/cockpit/interaction/CockpitInteractionProvider";
import {
  CockpitInteractionDrawer,
} from "@/components/cockpit/interaction/CockpitInteractionDrawer";
import { GlobalAiAssistantProvider } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import { GlobalAiAssistantPanel } from "@/components/cockpit/global-assistant/GlobalAiAssistantPanel";
import { CockpitRealtimeBridge } from "@/components/cockpit/ux/CockpitRealtimeBridge";
import { FounderShellProvider } from "@/lib/founder-shell/FounderShellProvider";

export function CockpitShell({ children }: { children: React.ReactNode }) {
  return (
    <CockpitInteractionProvider>
      <CockpitAuthGuard>
        <FounderShellProvider>
          <GlobalAiAssistantProvider>
          <div className="flex min-h-screen bg-[#030303] text-[#f5f0e6]">
            <CockpitSidebar />
            <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
              <CockpitTopBar />
              <ExecutiveCommandStrip />
              <main
                id="cockpit-main"
                aria-label="Cockpit content"
                className="flex-1 overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8"
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
