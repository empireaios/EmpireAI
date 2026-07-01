import { CockpitPanel } from "@/components/cockpit/layout/CockpitPanel";

const PLACEHOLDER_HEADLINE = "Portfolio velocity is accelerating across core ventures.";

const PLACEHOLDER_SUMMARY =
  "Commerce and intelligence pipelines are converging on Nova Home launch. Maintain margin discipline while scaling paid acquisition on top performers.";

const PLACEHOLDER_PRIORITIES = [
  { label: "Scale top revenue", severity: "High" },
  { label: "Launch Nova ads", severity: "Medium" },
  { label: "Manufacture vertical", severity: "High" },
];

/** SCR-010 zone: AI CEO briefing panel placeholder. */
export function AiCeoBriefingPlaceholder() {
  return (
    <CockpitPanel
      title="AI CEO Briefing"
      action={
        <span className="rounded border border-gold/15 px-2 py-1 text-[10px] uppercase tracking-wider text-[#d4af37]">
          Brief ↻
        </span>
      }
    >
      <p className="font-display text-lg text-[#f0d78c]">{PLACEHOLDER_HEADLINE}</p>
      <p className="mt-3 text-sm leading-relaxed text-[#c8c0b0]">{PLACEHOLDER_SUMMARY}</p>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
        Priorities
      </p>
      <ul className="mt-3 space-y-2">
        {PLACEHOLDER_PRIORITIES.map((priority, index) => (
          <li
            key={priority.label}
            className="flex items-center justify-between gap-3 text-sm text-[#8a847a]"
          >
            <span>
              {index + 1}. {priority.label}
            </span>
            <span className="shrink-0 rounded border border-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#d4af37]">
              {priority.severity}
            </span>
          </li>
        ))}
      </ul>
    </CockpitPanel>
  );
}
