import type { ReactNode } from "react";
import styles from "./ExecutiveTable.module.css";

export interface ExecutiveTableColumn<T> {
  key: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  /** Custom cell renderer. Falls back to String(row[key]) when omitted. */
  render?: (row: T) => ReactNode;
  width?: string;
}

export interface ExecutiveTableProps<T> {
  columns: ExecutiveTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  caption?: string;
  emptyMessage?: string;
}

/** Reusable premium data table with typed columns and optional row click-through. */
export function ExecutiveTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  caption,
  emptyMessage = "No data to display.",
}: ExecutiveTableProps<T>) {
  if (rows.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        {caption && <caption className={styles.caption}>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ textAlign: column.align ?? "left", width: column.width }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className={onRowClick ? styles.clickable : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} style={{ textAlign: column.align ?? "left" }}>
                  {column.render ? column.render(row) : asCell((row as Record<string, unknown>)[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function asCell(value: unknown): ReactNode {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number") return value;
  return String(value);
}
