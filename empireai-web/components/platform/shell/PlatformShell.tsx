import { PlatformMobileNav } from "./PlatformMobileNav";
import { PlatformSidebar } from "./PlatformSidebar";
import { PlatformTopBar } from "./PlatformTopBar";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#030303] text-[#f5f0e6]">
      <PlatformSidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-20 lg:pb-0">
        <PlatformTopBar />
        <main className="flex-1 overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <PlatformMobileNav />
    </div>
  );
}
