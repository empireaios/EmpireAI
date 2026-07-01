import { useMemo, useState } from "react";
import {
  Building2,
  Crown,
  Home,
  MoreHorizontal,
  Package,
  Rocket,
  Search,
  Server,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  mobileMoreNavItems,
  mobilePrimaryNavItems,
  type WorkspaceNavId,
  type WorkspaceNavItem,
} from "@/routes/paths";
import styles from "./MobileNav.module.css";

const mobileIcons: Partial<Record<WorkspaceNavId, typeof Home>> = {
  home: Home,
  command: Crown,
  intelligence: Search,
  launch: Rocket,
  operations: Package,
  brands: Building2,
  infrastructure: Server,
  settings: Settings,
};

export function MobileNav() {
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  function visibleItems(items: WorkspaceNavItem[]) {
    return items.filter((item) => {
      if (!item.roles) return true;
      if (!user) return false;
      return item.roles.includes(user.role);
    });
  }

  const primaryItems = useMemo(() => visibleItems(mobilePrimaryNavItems), [user]);
  const moreItems = useMemo(() => visibleItems(mobileMoreNavItems), [user]);

  return (
    <>
      <nav className={styles.bar} aria-label="Mobile navigation">
        {primaryItems.map((item) => {
          const Icon = mobileIcons[item.id] ?? Home;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
              }
            >
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          className={`${styles.tab} ${moreOpen ? styles.tabActive : ""}`}
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-haspopup="true"
        >
          <MoreHorizontal size={20} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className={styles.sheet} role="menu">
            {moreItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                role="menuitem"
                className={styles.sheetItem}
                onClick={() => setMoreOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </>
      )}
    </>
  );
}
