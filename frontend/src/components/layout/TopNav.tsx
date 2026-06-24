import { Bell, ChevronDown, Menu, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { StoreStatus } from "@/components/layout/Sidebar";
import { paths } from "@/routes/paths";
import styles from "./TopNav.module.css";

interface TopNavProps {
  storeName: string;
  storeStatus: StoreStatus;
  todayProfit: number;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function TopNav({
  storeName,
  storeStatus,
  todayProfit,
  sidebarCollapsed,
  onToggleSidebar,
}: TopNavProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const profitLabel =
    todayProfit >= 0
      ? `+$${todayProfit.toFixed(0)} profit`
      : `-$${Math.abs(todayProfit).toFixed(0)} profit`;

  return (
    <header className={styles.topnav}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={sidebarCollapsed}
        >
          <Menu size={20} />
        </button>
        <Link to={paths.dashboard.settingsStore} className={styles.storeLink}>
          {storeName}
        </Link>
        <StatusPill status={storeStatus} />
      </div>

      <div className={styles.right}>
        <Link to={paths.dashboard.profit} className={styles.profitSnippet}>
          Today: <strong>{profitLabel}</strong>
        </Link>

        <button
          type="button"
          className={styles.iconButton}
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className={styles.profileMenu} ref={profileRef}>
          <button
            type="button"
            className={styles.profileTrigger}
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <span className={styles.avatar}>
              <User size={16} />
            </span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>

          {profileOpen && (
            <div className={styles.dropdown} role="menu">
              <Link
                to={paths.dashboard.settingsAccount}
                role="menuitem"
                className={styles.dropdownItem}
                onClick={() => setProfileOpen(false)}
              >
                Account
              </Link>
              <Link
                to={paths.dashboard.billing}
                role="menuitem"
                className={styles.dropdownItem}
                onClick={() => setProfileOpen(false)}
              >
                Billing
              </Link>
              <Link
                to={paths.dashboard.settings}
                role="menuitem"
                className={styles.dropdownItem}
                onClick={() => setProfileOpen(false)}
              >
                Settings
              </Link>
              <Link
                to={paths.support}
                role="menuitem"
                className={styles.dropdownItem}
                onClick={() => setProfileOpen(false)}
              >
                Help
              </Link>
              <hr className={styles.dropdownDivider} />
              <button
                type="button"
                role="menuitem"
                className={styles.dropdownItem}
                onClick={() => {
                  setProfileOpen(false);
                  navigate(paths.login);
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function StatusPill({ status }: { status: StoreStatus }) {
  const labels: Record<StoreStatus, string> = {
    live: "Live",
    building: "Building",
    paused: "Paused",
  };

  return (
    <Link
      to={paths.dashboard.settingsStore}
      className={styles.statusPill}
      data-status={status}
    >
      {labels[status]}
    </Link>
  );
}
