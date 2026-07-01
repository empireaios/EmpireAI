import { useMemo } from "react";
import {
  Building2,
  CheckSquare,
  Crown,
  Compass,
  CreditCard,
  DollarSign,
  FileBarChart,
  Globe,
  History,
  Home,
  Layers,
  Map,
  Megaphone,
  MessagesSquare,
  Moon,
  Package,
  Plug,
  Rocket,
  Search,
  Server,
  Settings,
  Sparkles,
  Target,
  Truck,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { workspaceNavItems, type WorkspaceNavId, type WorkspaceNavItem } from "@/routes/paths";
import styles from "./Sidebar.module.css";

const navIcons: Record<WorkspaceNavId, typeof Home> = {
  home: Home,
  command: Crown,
  success001: Target,
  debate: MessagesSquare,
  soul: Sparkles,
  approvals: CheckSquare,
  pillow: Moon,
  kingHistory: History,
  aiTeam: Users,
  intelligence: Search,
  suppliers: Truck,
  marketplaces: Globe,
  advertising: Megaphone,
  expansion: Map,
  explorer: Compass,
  brands: Building2,
  launch: Rocket,
  operations: Package,
  reports: FileBarChart,
  operatingCost: DollarSign,
  infrastructure: Server,
  integrations: Plug,
  billing: CreditCard,
  settings: Settings,
};

export type StoreStatus = "live" | "building" | "paused";

interface SidebarProps {
  collapsed: boolean;
  storeName: string;
  storeStatus: StoreStatus;
  onTogglePillow?: () => void;
  pillowOpen?: boolean;
}

const sections: Array<{ key: WorkspaceNavItem["section"]; label: string }> = [
  { key: "command", label: "Command" },
  { key: "workspaces", label: "Workspaces" },
  { key: "system", label: "System" },
];

export function Sidebar({
  collapsed,
  storeName,
  storeStatus,
  onTogglePillow,
  pillowOpen,
}: SidebarProps) {
  const { user } = useAuth();

  const grouped = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      items: workspaceNavItems.filter((item) => {
        if (item.section !== section.key) return false;
        if (item.roles && user && !item.roles.includes(user.role)) return false;
        if (item.roles && !user) return false;
        return true;
      }),
    }));
  }, [user]);

  return (
    <aside
      className={styles.sidebar}
      data-collapsed={collapsed || undefined}
      aria-label="Empire workspaces"
    >
      <div className={styles.header}>
        <div className={styles.logoMark} aria-hidden="true">
          <Target size={18} strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className={styles.headerText}>
            <span className={styles.brandName}>EmpireAI</span>
            <span className={styles.storeName}>{storeName}</span>
            <StatusBadge status={storeStatus} />
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        {grouped.map((section) => (
          <div key={section.key} className={styles.section}>
            {!collapsed && <p className={styles.sectionLabel}>{section.label}</p>}
            <ul className={styles.navList}>
              {section.items.map((item) => {
                const Icon = navIcons[item.id];
                if (item.id === "pillow" && onTogglePillow) {
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={
                          pillowOpen
                            ? `${styles.navLink} ${styles.navLinkActive}`
                            : styles.navLink
                        }
                        title={collapsed ? item.label : undefined}
                        aria-pressed={pillowOpen}
                        onClick={onTogglePillow}
                      >
                        <Icon size={18} strokeWidth={2} aria-hidden="true" />
                        {!collapsed && <span>{item.label}</span>}
                      </button>
                    </li>
                  );
                }
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
                      <Icon size={18} strokeWidth={2} aria-hidden="true" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className={styles.footer}>
          <div className={styles.footerBadge}>
            <Layers size={14} aria-hidden="true" />
            <span>E-commerce OS</span>
          </div>
        </div>
      )}
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
