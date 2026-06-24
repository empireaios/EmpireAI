import {
  BarChart3,
  Bot,
  CreditCard,
  Factory,
  Home,
  Megaphone,
  Package,
  Search,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { dashboardNavItems, type DashboardNavId } from "@/routes/paths";
import styles from "./Sidebar.module.css";

const navIcons: Record<DashboardNavId, typeof Home> = {
  home: Home,
  orders: Package,
  ads: Megaphone,
  suppliers: Factory,
  "ai-team": Bot,
  intelligence: Search,
  billing: CreditCard,
  settings: Settings,
};

export type StoreStatus = "live" | "building" | "paused";

interface SidebarProps {
  collapsed: boolean;
  storeName: string;
  storeStatus: StoreStatus;
  storefrontUrl: string;
}

export function Sidebar({
  collapsed,
  storeName,
  storeStatus,
  storefrontUrl,
}: SidebarProps) {
  return (
    <aside
      className={styles.sidebar}
      data-collapsed={collapsed || undefined}
      aria-label="Main navigation"
    >
      <div className={styles.header}>
        <div className={styles.logoMark} aria-hidden="true">
          <BarChart3 size={20} strokeWidth={2.25} />
        </div>
        {!collapsed && (
          <div className={styles.headerText}>
            <span className={styles.storeName}>{storeName}</span>
            <StatusBadge status={storeStatus} />
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {dashboardNavItems.map((item) => {
            const Icon = navIcons[item.id];
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={20} strokeWidth={2} aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <a
          href={storefrontUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
          title={collapsed ? "View store" : undefined}
        >
          {!collapsed && <span>View store ↗</span>}
          {collapsed && <span aria-label="View store">↗</span>}
        </a>
        {!collapsed && (
          <a href="/support" className={styles.footerLinkMuted}>
            Help
          </a>
        )}
      </div>
    </aside>
  );
}

function StatusBadge({ status }: { status: StoreStatus }) {
  const labels: Record<StoreStatus, string> = {
    live: "Live",
    building: "Building",
    paused: "Paused",
  };

  return (
    <span className={styles.statusBadge} data-status={status}>
      {labels[status]}
    </span>
  );
}
