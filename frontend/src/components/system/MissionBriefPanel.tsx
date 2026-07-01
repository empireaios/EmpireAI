import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, ChevronRight, Gavel, HelpCircle, ShieldAlert, Target } from "lucide-react";
import { paths } from "@/routes/paths";
import styles from "./MissionBriefPanel.module.css";

export interface MissionBriefAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

export interface MissionBriefPanelProps {
  title?: string;
  /** What happened. */
  happened: ReactNode;
  /** Why it happened / the reasoning. */
  why: ReactNode;
  /** What to do next. */
  next: ReactNode;
  /** What decision is required of the Grand King (4th executive question). */
  decision?: ReactNode;
  /** SUCCESS-001 blocker chip — the single thing standing between now and $100K. */
  blocker?: ReactNode;
  /**
   * Where the SUCCESS-001 blocker chip links (UX-003 acceptance: reachable in ≤1 click
   * from any screen via the GC-06 chip). Defaults to the SUCCESS-001 Command Center.
   * Pass `null` to render a non-interactive chip (e.g. on the command center itself).
   */
  blockerTo?: string | null;
  action?: MissionBriefAction;
}

/**
 * The EmpireAI Executive Page Contract (GC-06).
 * Every Grand King screen answers: What happened → Why → What's next →
 * What decision is required, plus the SUCCESS-001 blocker chip.
 */
export function MissionBriefPanel({
  title = "Executive Briefing",
  happened,
  why,
  next,
  decision,
  blocker,
  blockerTo,
  action,
}: MissionBriefPanelProps) {
  const blockerHref = blockerTo === null ? null : blockerTo ?? paths.dashboard.success001;
  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {blocker !== undefined &&
          (blockerHref ? (
            <Link
              to={blockerHref}
              className={`${styles.blockerChip} ${styles.blockerChipLink}`}
              title="Open the SUCCESS-001 Command Center"
              aria-label={`Blocking SUCCESS-001${typeof blocker === "string" ? `: ${blocker}` : ""} — open the SUCCESS-001 Command Center`}
            >
              <ShieldAlert size={13} aria-hidden="true" />
              <span className={styles.blockerLabel}>Blocking SUCCESS-001:</span> {blocker}
              <ChevronRight size={13} aria-hidden="true" />
            </Link>
          ) : (
            <span className={styles.blockerChip} title="Blocking SUCCESS-001">
              <ShieldAlert size={13} aria-hidden="true" />
              <span className={styles.blockerLabel}>Blocking SUCCESS-001:</span> {blocker}
            </span>
          ))}
      </div>
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.rowIcon} data-kind="happened" aria-hidden="true"><Activity size={15} /></span>
          <div>
            <span className={styles.rowLabel}>What happened</span>
            <p className={styles.rowText}>{happened}</p>
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.rowIcon} data-kind="why" aria-hidden="true"><HelpCircle size={15} /></span>
          <div>
            <span className={styles.rowLabel}>Why</span>
            <p className={styles.rowText}>{why}</p>
          </div>
        </div>
        <div className={styles.row}>
          <span className={styles.rowIcon} data-kind="next" aria-hidden="true"><Target size={15} /></span>
          <div>
            <span className={styles.rowLabel}>What&apos;s next</span>
            <p className={styles.rowText}>{next}</p>
          </div>
        </div>
        {decision !== undefined && (
          <div className={styles.row}>
            <span className={styles.rowIcon} data-kind="decision" aria-hidden="true"><Gavel size={15} /></span>
            <div>
              <span className={styles.rowLabel}>Decision required</span>
              <p className={styles.rowText}>{decision}</p>
            </div>
          </div>
        )}
      </div>
      {action &&
        (action.to ? (
          <Link to={action.to} className={styles.action}>
            {action.label} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <button type="button" className={styles.action} onClick={action.onClick}>
            {action.label} <ArrowRight size={16} aria-hidden="true" />
          </button>
        ))}
    </section>
  );
}
