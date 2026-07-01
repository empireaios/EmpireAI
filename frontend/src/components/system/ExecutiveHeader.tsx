import { useState, type FormEvent, type ReactNode } from "react";
import { Bell, ChevronDown, Command, Crown, Search } from "lucide-react";
import styles from "./ExecutiveHeader.module.css";

export interface ExecutiveHeaderProps {
  /** Identity of the signed-in executive, e.g. "Grand King". */
  identityName: string;
  identityRole?: string;
  /** The single active mission shown in the header (UX: "current mission"). */
  currentMission?: { label: string; onClick?: () => void };
  notificationCount?: number;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onCommand?: () => void;
  onOpenNotifications?: () => void;
  onOpenIdentity?: () => void;
  /** Optional brand slot override; defaults to the EmpireAI lockup. */
  logo?: ReactNode;
}

export function ExecutiveHeader({
  identityName,
  identityRole,
  currentMission,
  notificationCount = 0,
  searchPlaceholder = "Search the empire — products, suppliers, markets…",
  onSearch,
  onCommand,
  onOpenNotifications,
  onOpenIdentity,
  logo,
}: ExecutiveHeaderProps) {
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    onSearch?.(query.trim());
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        {logo ?? (
          <>
            <span className={styles.logoMark} aria-hidden="true">
              <Crown size={18} strokeWidth={2.5} />
            </span>
            <span className={styles.logoText}>EmpireAI</span>
          </>
        )}
      </div>

      <form className={styles.search} role="search" onSubmit={handleSearch}>
        <Search size={16} aria-hidden="true" className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder={searchPlaceholder}
          aria-label="Global search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="button"
          className={styles.commandHint}
          onClick={onCommand}
          aria-label="Open command palette"
          title="Quick command"
        >
          <Command size={13} aria-hidden="true" />
          <span>K</span>
        </button>
      </form>

      <div className={styles.right}>
        {currentMission && (
          <button type="button" className={styles.missionChip} onClick={currentMission.onClick}>
            <span className={styles.missionDot} aria-hidden="true" />
            <span className={styles.missionLabel}>{currentMission.label}</span>
          </button>
        )}

        <button
          type="button"
          className={styles.iconButton}
          aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ""}`}
          onClick={onOpenNotifications}
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className={styles.badge}>{notificationCount > 99 ? "99+" : notificationCount}</span>
          )}
        </button>

        <button type="button" className={styles.identity} onClick={onOpenIdentity} aria-haspopup="menu">
          <span className={styles.avatar} aria-hidden="true">
            <Crown size={15} />
          </span>
          <span className={styles.identityText}>
            <span className={styles.identityName}>{identityName}</span>
            {identityRole && <span className={styles.identityRole}>{identityRole}</span>}
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
