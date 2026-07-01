import { CockpitPanel } from "@/components/cockpit/layout/CockpitPanel";

type PortfolioRow = {
  company: string;
  revenue: string;
  margin: string;
  status: string;
  statusGlyph: string;
};

const PLACEHOLDER_PORTFOLIO: PortfolioRow[] = [
  { company: "Acme Co", revenue: "$420K", margin: "42%", status: "Live", statusGlyph: "●" },
  { company: "Nova Home", revenue: "—", margin: "—", status: "Building", statusGlyph: "◐" },
  { company: "Summit Gear", revenue: "$128K", margin: "31%", status: "Live", statusGlyph: "●" },
  { company: "Idle ventures", revenue: "—", margin: "—", status: "3 paused", statusGlyph: "○" },
];

/** SCR-010 zone: Portfolio overview table placeholder. */
export function PortfolioOverviewPlaceholder() {
  return (
    <CockpitPanel
      title="Portfolio"
      action={
        <span className="text-xs text-[#d4af37]">View all</span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-gold/10 text-[10px] uppercase tracking-[0.15em] text-[#6f6a60]">
              <th className="pb-2 pr-4 font-semibold">Company</th>
              <th className="pb-2 pr-4 font-semibold">Revenue</th>
              <th className="pb-2 pr-4 font-semibold">Margin</th>
              <th className="pb-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {PLACEHOLDER_PORTFOLIO.map((row) => (
              <tr key={row.company} className="border-b border-gold/5 last:border-0">
                <td className="py-2.5 pr-4 text-[#f0d78c]">{row.company}</td>
                <td className="py-2.5 pr-4 text-[#c8c0b0]">{row.revenue}</td>
                <td className="py-2.5 pr-4 text-[#c8c0b0]">{row.margin}</td>
                <td className="py-2.5 text-[#8a847a]">
                  <span className="text-[#d4af37]">{row.statusGlyph}</span> {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CockpitPanel>
  );
}
