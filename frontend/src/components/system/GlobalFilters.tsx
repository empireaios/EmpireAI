import { RotateCcw } from "lucide-react";
import styles from "./GlobalFilters.module.css";

export interface FilterOption {
  value: string;
  label: string;
}

export interface GlobalFiltersValue {
  country?: string;
  marketplace?: string;
  brand?: string;
  date?: string;
  status?: string;
}

export interface GlobalFiltersProps {
  value: GlobalFiltersValue;
  onChange: (next: GlobalFiltersValue) => void;
  countries?: FilterOption[];
  marketplaces?: FilterOption[];
  brands?: FilterOption[];
  statuses?: FilterOption[];
  /** Hide filters that aren't relevant to a given screen. */
  show?: Partial<Record<keyof GlobalFiltersValue, boolean>>;
  onReset?: () => void;
}

const DEFAULT_SHOW: Record<keyof GlobalFiltersValue, boolean> = {
  country: true,
  marketplace: true,
  brand: true,
  date: true,
  status: true,
};

/** Reusable global filter bar: Country · Marketplace · Brand · Date · Status. */
export function GlobalFilters({
  value,
  onChange,
  countries = [],
  marketplaces = [],
  brands = [],
  statuses = [],
  show,
  onReset,
}: GlobalFiltersProps) {
  const visible = { ...DEFAULT_SHOW, ...show };

  function update(key: keyof GlobalFiltersValue, next: string) {
    onChange({ ...value, [key]: next || undefined });
  }

  return (
    <div className={styles.bar} role="group" aria-label="Global filters">
      {visible.country && (
        <Select label="Country" value={value.country} options={countries} allLabel="All countries" onChange={(v) => update("country", v)} />
      )}
      {visible.marketplace && (
        <Select label="Marketplace" value={value.marketplace} options={marketplaces} allLabel="All marketplaces" onChange={(v) => update("marketplace", v)} />
      )}
      {visible.brand && (
        <Select label="Brand" value={value.brand} options={brands} allLabel="All brands" onChange={(v) => update("brand", v)} />
      )}
      {visible.status && (
        <Select label="Status" value={value.status} options={statuses} allLabel="Any status" onChange={(v) => update("status", v)} />
      )}
      {visible.date && (
        <label className={styles.field}>
          <span className={styles.label}>Date</span>
          <input
            type="date"
            className={styles.input}
            value={value.date ?? ""}
            onChange={(event) => update("date", event.target.value)}
          />
        </label>
      )}
      {onReset && (
        <button type="button" className={styles.reset} onClick={onReset} aria-label="Reset filters">
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </button>
      )}
    </div>
  );
}

interface SelectProps {
  label: string;
  value?: string;
  options: FilterOption[];
  allLabel: string;
  onChange: (value: string) => void;
}

function Select({ label, value, options, allLabel, onChange }: SelectProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <select className={styles.input} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
