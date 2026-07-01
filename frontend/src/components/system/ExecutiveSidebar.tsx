import { useMemo, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import styles from "./ExecutiveSidebar.module.css";

export interface ExecutiveNavItem {
  id: string;
  label: string;
  to: string;
  icon?: ReactNode;
  /** Optional grouping label. Items keep their first-seen section order. */
  section?: string;
  badge?: number;
  end?: boolean;
}

export interface ExecutiveSidebarProps {
  items: ExecutiveNavItem[];
  collapsed?: boolean;
  brandName?: string;
  brandSubtitle?: string;
  footer?: ReactNode;
}

export function ExecutiveSidebar({
  items,
  collapsed = false,
  brandName = "EmpireAI",
  brandSubtitle,
  footer,
}: ExecutiveSidebarProps) {
  // Group by section while preserving the order each section first appears in.
  const groups = useMemo(() => {
    const order: string[] = [];
    const bySection = new Map<string, ExecutiveNavItem[]>();
    for (const item of items) {
      const key = item.section ?? "";
      if (!bySection.has(key)) {
        bySection.set(key, []);
        order.push(key);
      }
      bySection.get(key)!.push(item);
    }
    return order.map((key) => ({ key, items: bySection.get(key)! }));
  }, [items]);

  return (
    <aside className={styles.sidebar} data-collapsed={collapsed || undefined} aria-label="Executive navigation">
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">
          {brandName.slice(0, 1)}
        </span>
        {!collapsed && (
          <span className={styles.brandText}>
            <span className={styles.brandName}>{brandName}</span>
            {brandSubtitle && <span className={styles.brandSubtitle}>{brandSubtitle}</span>}
          </span>
        )}
      </div>

      <nav className={styles.nav}>
        {groups.map((group) => (
          <div key={group.key || "default"} className={styles.section}>
            {!collapsed && group.key && <p className={styles.sectionLabel}>{group.key}</p>}
            <ul className={styles.list}>
              {group.items.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      isActive ? `${styles.link} ${styles.linkActive}` : styles.link
                    }
                  >
                    {item.icon && <span className={styles.icon} aria-hidden="true">{item.icon}</span>}
                    {!collapsed && <span className={styles.label}>{item.label}</span>}
                    {!collapsed && item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
}
