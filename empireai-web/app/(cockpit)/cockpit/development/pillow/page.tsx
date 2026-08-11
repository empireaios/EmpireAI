import { Suspense } from "react";
import { DevelopmentPillowExperience } from "@/components/cockpit/development/DevelopmentPillowExperience";

export default function DevelopmentPillowPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-gold/15 px-5 py-8 text-sm text-[#8a847a]">
          Opening Pillow conversation…
        </div>
      }
    >
      <DevelopmentPillowExperience />
    </Suspense>
  );
}
