import { GrandKingOperatingDashboard } from "@/components/cockpit/grand-king/GrandKingOperatingDashboard";

/** SCR P8-GRAND-KING · P8-06 — Permanent Grand King Operating Account */
export default function GrandKingOperatingAccountPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Founder · P8-06</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Grand King Operating Account</h1>
        <p className="text-sm text-[#8a847a]">
          Constitutional production reference · co-grand-king · ws-foundation
        </p>
      </header>
      <GrandKingOperatingDashboard />
    </div>
  );
}
