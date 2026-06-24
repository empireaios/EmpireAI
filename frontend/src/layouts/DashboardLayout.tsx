import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import styles from "./DashboardLayout.module.css";

/** Placeholder store context — replaced when auth/store modules exist */
const PLACEHOLDER_STORE = {
  name: "My Store",
  status: "live" as const,
  todayProfit: 0,
  storefrontUrl: "https://example.empireai.store",
};

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={styles.root}>
      <Sidebar
        collapsed={sidebarCollapsed}
        storeName={PLACEHOLDER_STORE.name}
        storeStatus={PLACEHOLDER_STORE.status}
        storefrontUrl={PLACEHOLDER_STORE.storefrontUrl}
      />
      <div
        className={styles.main}
        data-sidebar-collapsed={sidebarCollapsed || undefined}
      >
        <TopNav
          storeName={PLACEHOLDER_STORE.name}
          storeStatus={PLACEHOLDER_STORE.status}
          todayProfit={PLACEHOLDER_STORE.todayProfit}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        />
        <main className={styles.content} id="main-content">
          <Outlet />
        </main>
      </div>
      <MobileNav storefrontUrl={PLACEHOLDER_STORE.storefrontUrl} />
    </div>
  );
}
