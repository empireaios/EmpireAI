import { CorporateVisionDashboard } from "@/components/cockpit/corporate-vision/CorporateVisionDashboard";

/** SCR E1-VISION · E1-02 — Corporate Vision Engine */
export default function CorporateVisionPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-[#6f6a60]">Executive Programme · E1-02 · Vision Governance</p>
        <h1 className="font-display text-2xl text-[#f0d78c]">Corporate Vision</h1>
        <p className="text-sm text-[#8a847a]">
          One permanent Vision Engine · highest executive planning authority beneath the Constitution
        </p>
      </header>
      <CorporateVisionDashboard />
    </div>
  );
}
