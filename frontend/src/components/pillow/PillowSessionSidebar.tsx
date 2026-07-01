import { Bookmark, Plus, Search } from "lucide-react";
import type { PillowLocalSession } from "@/lib/pillow-sessions";
import styles from "./PillowSessionSidebar.module.css";

interface PillowSessionSidebarProps {
  sessions: PillowLocalSession[];
  activeSessionId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onBookmark: (sessionId: string) => void;
}

export function PillowSessionSidebar({
  sessions,
  activeSessionId,
  search,
  onSearchChange,
  onSelect,
  onNewSession,
  onBookmark,
}: PillowSessionSidebarProps) {
  return (
    <aside className={styles.root}>
      <div className={styles.header}>
        <h3>Sessions</h3>
        <button type="button" className={styles.iconBtn} onClick={onNewSession} title="New session">
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      <label className={styles.search}>
        <Search size={14} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search sessions…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <ul className={styles.list}>
        {sessions.length === 0 && <li className={styles.empty}>No saved sessions</li>}
        {sessions.map((session) => (
          <li key={session.id}>
            <button
              type="button"
              className={`${styles.item} ${session.id === activeSessionId ? styles.active : ""}`}
              onClick={() => onSelect(session.id)}
            >
              <span className={styles.label}>{session.label}</span>
              <span className={styles.meta}>
                {new Date(session.lastActiveAt).toLocaleDateString()}
              </span>
            </button>
            <button
              type="button"
              className={`${styles.bookmark} ${session.bookmarked ? styles.bookmarked : ""}`}
              onClick={() => onBookmark(session.id)}
              title={session.bookmarked ? "Remove bookmark" : "Bookmark session"}
            >
              <Bookmark size={14} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
