import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import styles from "./SettingsPage.module.css";

const settingsTabs = [
  { label: "Account", path: "account" },
  { label: "Store", path: "store" },
  { label: "Notifications", path: "notifications" },
  { label: "Security", path: "security" },
] as const;

export function SettingsPage() {
  return (
    <>
      <DashboardPageShell
        title="Settings"
        description="Account, store, notifications, and security preferences."
      >
        <nav className={styles.tabs} aria-label="Settings sections">
          {settingsTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.panel}>
          <Routes>
            <Route index element={<Navigate to="account" replace />} />
            <Route path="account" element={<SettingsPanel title="Account" />} />
            <Route path="store" element={<SettingsPanel title="Store" />} />
            <Route
              path="notifications"
              element={<SettingsPanel title="Notifications" />}
            />
            <Route path="security" element={<SettingsPanel title="Security" />} />
          </Routes>
        </div>
      </DashboardPageShell>
    </>
  );
}

function SettingsPanel({ title }: { title: string }) {
  return (
    <div>
      <h2 className={styles.panelTitle}>{title}</h2>
      <p className={styles.panelHint}>Settings form coming soon.</p>
    </div>
  );
}
