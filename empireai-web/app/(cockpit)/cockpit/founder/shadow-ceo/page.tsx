import { ShadowCeoOperatingPanel } from "@/components/cockpit/shadow-ceo/ShadowCeoOperatingPanel";

export default function ShadowCeoOperatingPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[#d4af37]">Shadow CEO Operating Environment</h1>
        <p className="mt-1 text-sm text-[#8a847a]">
          SYNTHETIC foundation · real commerce locked · Birth not authorised · Wave 1 remains 0/24
        </p>
      </header>
      <ShadowCeoOperatingPanel />
    </div>
  );
}
