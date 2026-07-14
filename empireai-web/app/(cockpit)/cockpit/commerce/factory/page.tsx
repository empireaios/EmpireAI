import { FactoryDashboard } from "@/components/cockpit/factory/FactoryDashboard";

/** SCR P8-FACTORY · P8-01 — Permanent Business Factory Architecture */
export default function CommerceFactoryPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Commerce · P8-01</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Business Factory</h1>
        <p className="text-sm text-[#8a847a]">
          Factory That Manufactures Companies — vision through launch · operation · growth
        </p>
      </header>
      <FactoryDashboard />
    </div>
  );
}
