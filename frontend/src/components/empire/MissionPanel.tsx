import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import type { MissionAction } from "@/lib/mission-engine";
import styles from "./MissionPanel.module.css";

interface MissionPanelProps {
  missions: MissionAction[];
  title?: string;
  compact?: boolean;
}

const priorityLabels: Record<MissionAction["priority"], string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function MissionPanel({ missions, title = "Recommended Actions", compact = false }: MissionPanelProps) {
  if (missions.length === 0) {
    return (
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <Zap size={18} aria-hidden="true" />
          <h2 className={styles.panelTitle}>{title}</h2>
        </div>
        <p className={styles.empty}>All clear — no urgent actions right now.</p>
      </section>
    );
  }

  const visible = compact ? missions.slice(0, 4) : missions;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <Zap size={18} aria-hidden="true" />
        <h2 className={styles.panelTitle}>{title}</h2>
      </div>
      <ul className={styles.list}>
        {visible.map((mission) => (
          <li key={mission.id} className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemTop}>
                <span className={styles.priority} data-priority={mission.priority}>
                  {priorityLabels[mission.priority]}
                </span>
                <span className={styles.category}>{mission.category}</span>
              </div>
              <p className={styles.itemTitle}>{mission.title}</p>
              <p className={styles.itemWhy}>{mission.why}</p>
            </div>
            {mission.href && (
              <Link to={mission.href} className={styles.actionLink} aria-label={`Go: ${mission.title}`}>
                <ArrowRight size={18} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface BlockerPanelProps {
  blockers: string[];
}

export function BlockerPanel({ blockers }: BlockerPanelProps) {
  return (
    <section className={`${styles.panel} ${styles.blockerPanel}`}>
      <h2 className={styles.panelTitlePlain}>Critical Blockers</h2>
      {blockers.length === 0 ? (
        <p className={styles.empty}>No critical blockers detected.</p>
      ) : (
        <ul className={styles.blockerList}>
          {blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
