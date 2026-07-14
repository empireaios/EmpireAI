import { CommerceOperatingDashboard } from "@/components/cockpit/commerce/CommerceOperatingDashboard";

/** SCR P8-COMMERCE · P8-02 — Permanent Commerce Operating Model */
export default function CommerceOperatingPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Commerce · P8-02</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Commerce Operating Model</h1>
        <p className="text-sm text-[#8a847a]">
          Economic engine — products · orders · payments · marketing · revenue · growth
        </p>
      </header>
      <CommerceOperatingDashboard />
    </div>
  );
}
