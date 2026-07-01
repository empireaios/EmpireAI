import type { PillowMissionBoard } from "@/api/pillow";
import styles from "./PillowMissionCenter.module.css";

interface PillowMissionCenterProps {
  board: PillowMissionBoard | null;
}

function MissionList({
  title,
  items,
  tone,
}: {
  title: string;
  items: PillowMissionBoard[keyof PillowMissionBoard];
  tone: string;
}) {
  return (
    <div className={styles.column}>
      <h4>
        <span className={`${styles.dot} ${tone}`} />
        {title}
        <span className={styles.count}>{items.length}</span>
      </h4>
      {items.length === 0 ? (
        <p className={styles.empty}>None</p>
      ) : (
        <ul>
          {items.map((mission) => (
            <li key={mission.missionId}>
              <strong>{mission.title}</strong>
              <span>
                {mission.phase} · {mission.presence}
                {mission.dryRun ? " · dry-run" : ""}
              </span>
              {mission.lastError && <em>{mission.lastError}</em>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PillowMissionCenter({ board }: PillowMissionCenterProps) {
  if (!board) {
    return (
      <section className={styles.root}>
        <h3>Mission Center</h3>
        <p className={styles.empty}>Loading mission board…</p>
      </section>
    );
  }

  return (
    <section className={styles.root}>
      <h3>Mission Center</h3>
      <div className={styles.board}>
        <MissionList title="Running" items={board.running} tone={styles.running} />
        <MissionList title="Queued" items={board.queued} tone={styles.queued} />
        <MissionList title="Completed" items={board.completed} tone={styles.completed} />
        <MissionList title="Failed" items={board.failed} tone={styles.failed} />
      </div>
    </section>
  );
}
