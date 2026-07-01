import { CockpitMobileNav } from "./CockpitMobileNav";
import { CockpitSidebar } from "./CockpitSidebar";
import { CockpitTopBar } from "./CockpitTopBar";

export function CockpitShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#030303] text-[#f5f0e6]">
      <CockpitSidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-20 lg:pb-0">
        <CockpitTopBar />
        <main className="flex-1 overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <CockpitMobileNav />
    </div>
  );
}
