"use client";

import { ActionButton, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  FINANCE_EXPENSE_ROWS,
  FINANCE_METRICS,
  FINANCE_PL_WATERFALL,
  FINANCE_REVENUE_ROWS,
  FINANCE_TREASURY_ACCOUNTS,
} from "@/components/cockpit/widgets/finance/financeDemoData";

/** SCR-400 — Finance Dashboard / Profit (REAL-107). */
export function FinanceDashboardPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FINANCE_METRICS.map((m) => (
          <StatCard key={m.label} {...m} />
        ))}
      </div>
      <Panel title="7-Day Profit Trend" subtitle="Chart placeholder — demo ledger">
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gold/20 text-sm text-[#6f6a60]">
          Profit trend visualization — REAL-127+ live data
        </div>
      </Panel>
      <Panel title="Top Companies by Profit Today">
        <DataTable
          keyField="id"
          data={FINANCE_REVENUE_ROWS}
          columns={[
            { key: "source", header: "Company" },
            { key: "channel", header: "Channel" },
            { key: "amount", header: "Amount" },
            { key: "period", header: "Period" },
          ]}
        />
      </Panel>
    </div>
  );
}

/** SCR-401 — Finance Revenue / P&L (REAL-108). */
export function FinanceRevenuePanel() {
  return (
    <div className="space-y-6">
      <ActionButton disabled>Download P&L</ActionButton>
      <Panel title="P&L Waterfall" subtitle="Revenue → COGS → Ad spend → Net profit">
        <ul className="space-y-3">
          {FINANCE_PL_WATERFALL.map((row) => (
            <li key={row.label} className="flex justify-between rounded-lg border border-gold/10 px-4 py-3 text-sm">
              <span className="text-[#c8c0b0]">{row.label}</span>
              <span className="font-medium text-[#f0d78c]">{row.value}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/** SCR-403 — Finance Expenses / Costs (REAL-109). */
export function FinanceExpensesPanel() {
  return (
    <div className="space-y-6">
      <Panel title="Operating Expenses" subtitle="Demo cost categories">
        <DataTable
          keyField="id"
          data={FINANCE_EXPENSE_ROWS}
          columns={[
            { key: "category", header: "Category" },
            { key: "amount", header: "Amount" },
            { key: "trend", header: "Trend" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Panel>
    </div>
  );
}

/** SCR-402 — Finance Treasury / Billing (REAL-110). */
export function FinanceTreasuryPanel() {
  return (
    <div className="space-y-6">
      <ActionButton disabled>Manage billing</ActionButton>
      <Panel title="Treasury Accounts" subtitle="Cash position — demo presentation">
        <DataTable
          keyField="id"
          data={FINANCE_TREASURY_ACCOUNTS}
          columns={[
            { key: "name", header: "Account" },
            { key: "balance", header: "Balance" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Panel>
    </div>
  );
}
