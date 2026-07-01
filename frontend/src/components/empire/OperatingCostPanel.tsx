import { useMemo } from "react";
import {
  categoryTotal,
  overallOperatingCost,
  saveOperatingCost,
  OPERATING_COST_CATEGORY_LABELS,
  type OperatingCostCategory,
  type OperatingCostItem,
} from "@/lib/operating-cost";
import styles from "./OperatingCostPanel.module.css";

interface OperatingCostPanelProps {
  items: OperatingCostItem[];
  onChange: (items: OperatingCostItem[]) => void;
}

const CATEGORY_ORDER: OperatingCostCategory[] = ["infrastructure", "ai"];

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function formatUpdated(iso: string): string {
  if (!iso) return "Not set";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function OperatingCostPanel({ items, onChange }: OperatingCostPanelProps) {
  const infraTotal = useMemo(() => categoryTotal(items, "infrastructure"), [items]);
  const aiTotal = useMemo(() => categoryTotal(items, "ai"), [items]);
  const overall = useMemo(() => overallOperatingCost(items), [items]);

  function handleCostChange(id: string, raw: string) {
    const parsed = Number.parseFloat(raw);
    const monthlyCostUsd = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    const next = items.map((item) =>
      item.id === id ? { ...item, monthlyCostUsd, updatedAt: new Date().toISOString() } : item,
    );
    saveOperatingCost(next);
    onChange(next);
  }

  return (
    <section className={`empireCard ${styles.panel}`} aria-label="Operating Cost Table">
      <div className={styles.head}>
        <div>
          <p className="empireEyebrow">Operating Cost · Monthly</p>
          <h2 className={styles.title}>What it costs to run the empire</h2>
        </div>
        <p className={styles.hint}>Enter actual costs — saved on this device, ready for a live feed.</p>
      </div>

      <div className={styles.tableWrap}>
        <table className={`empireTable ${styles.table}`}>
          <thead>
            <tr>
              <th>Component</th>
              <th>Provider</th>
              <th className={styles.numCol}>Current Monthly Cost</th>
              <th className={styles.numCol}>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORY_ORDER.map((category) => {
              const rows = items.filter((item) => item.category === category);
              if (rows.length === 0) return null;
              return (
                <FragmentRows
                  key={category}
                  category={category}
                  rows={rows}
                  onCostChange={handleCostChange}
                />
              );
            })}
          </tbody>
          <tfoot>
            <tr className={styles.totalRow}>
              <td colSpan={2}>Infrastructure Total</td>
              <td className={styles.numCol}>{formatUsd(infraTotal)}</td>
              <td className={styles.numCol} aria-hidden="true" />
            </tr>
            <tr className={styles.totalRow}>
              <td colSpan={2}>AI Total</td>
              <td className={styles.numCol}>{formatUsd(aiTotal)}</td>
              <td className={styles.numCol} aria-hidden="true" />
            </tr>
            <tr className={styles.grandTotalRow}>
              <td colSpan={2}>Overall Monthly Operating Cost</td>
              <td className={styles.numCol}>{formatUsd(overall)}</td>
              <td className={styles.numCol} aria-hidden="true" />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

interface FragmentRowsProps {
  category: OperatingCostCategory;
  rows: OperatingCostItem[];
  onCostChange: (id: string, raw: string) => void;
}

function FragmentRows({ category, rows, onCostChange }: FragmentRowsProps) {
  return (
    <>
      <tr className={styles.groupRow}>
        <td colSpan={4}>{OPERATING_COST_CATEGORY_LABELS[category]}</td>
      </tr>
      {rows.map((item) => (
        <tr key={item.id}>
          <td className={styles.componentCell}>{item.component}</td>
          <td>{item.provider}</td>
          <td className={styles.numCol}>
            <div className={styles.inputWrap}>
              <span className={styles.currency}>$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className={styles.costInput}
                value={item.monthlyCostUsd === 0 ? "" : item.monthlyCostUsd}
                placeholder="0.00"
                aria-label={`${item.component} monthly cost`}
                onChange={(event) => onCostChange(item.id, event.target.value)}
              />
            </div>
          </td>
          <td className={styles.numCol}>{formatUpdated(item.updatedAt)}</td>
        </tr>
      ))}
    </>
  );
}
