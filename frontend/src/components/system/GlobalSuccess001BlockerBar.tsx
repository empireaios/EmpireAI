import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { paths } from "@/routes/paths";
import styles from "./GlobalSuccess001BlockerBar.module.css";

export interface GlobalSuccess001BlockerBarProps {
  blocker: string;
}

/** GC-06 — universal SUCCESS-001 blocker chip (live REAL-035 · reachable in ≤1 click). */
export function GlobalSuccess001BlockerBar({ blocker }: GlobalSuccess001BlockerBarProps) {
  return (
    <div className={styles.bar} data-testid="gc-06-blocker-bar" aria-label="SUCCESS-001 blocker">
      <Link
        to={paths.dashboard.success001}
        className={styles.chip}
        title="Open the SUCCESS-001 Command Center"
        aria-label={`Blocking SUCCESS-001: ${blocker} — open the SUCCESS-001 Command Center`}
      >
        <Target size={14} aria-hidden="true" />
        <span className={styles.label}>Blocking SUCCESS-001:</span>
        <span className={styles.text}>{blocker}</span>
      </Link>
    </div>
  );
}
