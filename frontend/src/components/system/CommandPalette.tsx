import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  fetchCommercialExplorerDashboard,
  type CommercialExplorerItem,
} from "@/api/commercial-explorer";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { dimensionLabel, entityOwnerPath, ownerScreenLabel } from "@/lib/commercial-explorer-links";
import { paths } from "@/routes/paths";
import styles from "./CommandPalette.module.css";

interface PaletteRow extends CommercialExplorerItem {
  ownerPath: string;
  ownerLabel: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

/** GC-04 — Command Palette + Global Search powered by REAL-066 entity index. */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CommercialExplorerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const canUse = user?.role === "founder" || user?.role === "admin";

  useEffect(() => {
    if (!open || !canUse) return;
    setQuery("");
    setActiveIndex(0);
    setLoading(true);
    void fetchCommercialExplorerDashboard(GRAND_KING_COMPANY_ID)
      .then(({ dashboard }) => setItems(dashboard.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open, canUse]);

  const rows = useMemo<PaletteRow[]>(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((item) => {
        if (!normalized) return true;
        return (
          item.name.toLowerCase().includes(normalized) ||
          item.summary.toLowerCase().includes(normalized) ||
          dimensionLabel(item.dimension).toLowerCase().includes(normalized)
        );
      })
      .slice(0, 12)
      .map((item) => ({
        ...item,
        ownerPath: entityOwnerPath(item.dimension, item.itemId),
        ownerLabel: ownerScreenLabel(item.dimension),
      }));
  }, [items, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const selectRow = useCallback(
    (row: PaletteRow) => {
      onClose();
      navigate(row.ownerPath);
    },
    [navigate, onClose],
  );

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(rows.length - 1, 0)));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === "Enter" && rows[activeIndex]) {
        event.preventDefault();
        selectRow(rows[activeIndex]);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, rows, activeIndex, onClose, selectRow]);

  if (!open || !canUse) return null;

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className={styles.input}
            placeholder="Search the empire — REAL-066 entity index…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Command palette search"
          />
          <span className={styles.hint}>↵ open · esc close</span>
        </div>

        <ul className={styles.list} role="listbox" aria-label="Search results">
          {loading && <li className={styles.empty}>Loading entity index…</li>}
          {!loading && rows.length === 0 && (
            <li className={styles.empty}>No entities match — try another query.</li>
          )}
          {!loading &&
            rows.map((row, index) => (
              <li key={row.itemId} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={index === activeIndex ? styles.itemActive : styles.item}
                  onClick={() => selectRow(row)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className={styles.itemName}>
                    {row.name} · {dimensionLabel(row.dimension)}
                  </span>
                  <span className={styles.itemMeta}>
                    {row.ownerLabel} — {row.summary}
                  </span>
                </button>
              </li>
            ))}
        </ul>

        <div className={styles.footer}>
          REAL-066 commercial-explorer ·{" "}
          <button type="button" className={styles.item} style={{ display: "inline", padding: 0 }} onClick={() => { onClose(); navigate(paths.dashboard.explorer); }}>
            Open full explorer
          </button>
        </div>
      </div>
    </div>
  );
}

export function useCommandPaletteShortcut(onOpen: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen, enabled]);
}
