import { CockpitPanel } from "@/components/cockpit/layout/CockpitPanel";

const PLACEHOLDER_COMPANIES = [
  { name: "Acme Co", status: "scaling", glyph: "●" },
  { name: "Nova Home", status: "building", glyph: "◐" },
  { name: "3 ventures", status: "idle", glyph: "○" },
];

/** REAL-079 zone: Portfolio pulse placeholder. */
export function PortfolioPulsePlaceholder() {
  return (
    <CockpitPanel title="Portfolio Pulse">
      <ul className="space-y-2">
        {PLACEHOLDER_COMPANIES.map((company) => (
          <li key={company.name} className="flex items-center gap-2 text-sm text-[#c8c0b0]">
            <span className="text-[#d4af37]">{company.glyph}</span>
            <span className="text-[#f0d78c]">{company.name}</span>
            <span className="text-[#6f6a60]">— {company.status}</span>
          </li>
        ))}
      </ul>
    </CockpitPanel>
  );
}
