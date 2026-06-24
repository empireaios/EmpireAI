import {
  Bot,
  Home,
  Megaphone,
  MoreHorizontal,
  Package,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  mobileMoreNavItems,
  mobilePrimaryNavItems,
  paths,
  type DashboardNavId,
} from "@/routes/paths";
import styles from "./MobileNav.module.css";

const mobileIcons: Partial<Record<DashboardNavId, typeof Home>> = {
  home: Home,
  orders: Package,
  ads: Megaphone,
  "ai-team": Bot,
};

interface MobileNavProps {
  storefrontUrl: string;
}

export function MobileNav({ storefrontUrl }: MobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className={styles.bar} aria-label="Mobile navigation">
        {mobilePrimaryNavItems.map((item) => {
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
            {mobileMoreNavItems.map((item) => (
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
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className={styles.sheetItem}
              onClick={() => setMoreOpen(false)}
            >
              View store ↗
            </a>
            <NavLink
              to={paths.support}
              role="menuitem"
              className={styles.sheetItem}
              onClick={() => setMoreOpen(false)}
            >
              Help
            </NavLink>
          </div>
        </>
      )}
    </>
  );
}
