import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { PillowCompanionIcon } from "@/components/pillow/PillowCompanionIcon";
import { PillowCompanionPanel } from "@/components/pillow/PillowCompanionPanel";
import { CommandPalette, useCommandPaletteShortcut } from "@/components/system/CommandPalette";
import { GlobalApprovalBar } from "@/components/system/GlobalApprovalBar";
import { GlobalSuccess001BlockerBar } from "@/components/system/GlobalSuccess001BlockerBar";
import {
  GlobalAssistantPanel,
  useGlobalAssistantShortcut,
} from "@/components/system/GlobalAssistantPanel";
import {
  NotificationsCenter,
  useNotificationsUnreadCount,
} from "@/components/system/NotificationsCenter";
import { GlobalAssistantProvider, useGlobalAssistant } from "@/context/GlobalAssistantContext";
import { PillowCompanionProvider, usePillowCompanion } from "@/context/PillowCompanionContext";
import { useAuth } from "@/context/AuthContext";
import { useFounderGovernanceChrome } from "@/hooks/useFounderGovernanceChrome";
import { isFounderPersona } from "@/lib/post-login-destination";
import styles from "./DashboardLayout.module.css";

function DashboardShellBase({
  isFounder,
  showCompanionChrome,
  companionOpen,
  onTogglePillow,
}: {
  isFounder: boolean;
  showCompanionChrome: boolean;
  companionOpen?: boolean;
  onTogglePillow?: () => void;
}) {
  const { user } = useAuth();
  const { open, openAssistant, closeAssistant } = useGlobalAssistant();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const governance = useFounderGovernanceChrome(isFounder);
  const { unreadCount, setUnreadCount } = useNotificationsUnreadCount(isFounder);

  useCommandPaletteShortcut(() => setPaletteOpen(true), isFounder);
  useGlobalAssistantShortcut(() => openAssistant(), isFounder);

  const storeContext = useMemo(
    () => ({
      name: user?.role === "founder" ? "Grand King's Account" : user?.name ?? "EmpireAI",
      storeStatus: "building" as const,
      todayProfit: 0,
    }),
    [user],
  );

  return (
    <div className={styles.root}>
      <Sidebar
        collapsed={sidebarCollapsed}
        storeName={storeContext.name}
        storeStatus={storeContext.storeStatus}
        onTogglePillow={onTogglePillow}
        pillowOpen={companionOpen}
      />

      <div
        className={styles.main}
        data-sidebar-collapsed={sidebarCollapsed || undefined}
        data-companion-open={companionOpen || undefined}
      >
        <TopNav
          storeName={storeContext.name}
          storeStatus={storeContext.storeStatus}
          todayProfit={storeContext.todayProfit}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          notificationCount={unreadCount}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenAssistant={() => openAssistant()}
        />

        {isFounder && (
          <>
            <GlobalApprovalBar
              pendingCount={governance.pendingCount}
              topItem={governance.topItem}
              onVerdict={governance.recordVerdict}
            />
            <GlobalSuccess001BlockerBar blocker={governance.blockerText} />
          </>
        )}

        <main className={styles.content} id="main-content">
          <Outlet />
        </main>
      </div>

      <MobileNav />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <NotificationsCenter
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onUnreadChange={setUnreadCount}
      />
      <GlobalAssistantPanel open={open} onClose={closeAssistant} />

      {showCompanionChrome && (
        <>
          <PillowCompanionIcon />
          <PillowCompanionPanel />
        </>
      )}
    </div>
  );
}

function DashboardShellWithCompanion({ isFounder }: { isFounder: boolean }) {
  const { open, toggleCompanion } = usePillowCompanion();
  return (
    <DashboardShellBase
      isFounder={isFounder}
      showCompanionChrome
      companionOpen={open}
      onTogglePillow={toggleCompanion}
    />
  );
}

function DashboardLayoutInner() {
  const { user } = useAuth();
  const isFounder = user ? isFounderPersona(user.role) : false;
  const governance = useFounderGovernanceChrome(isFounder);
  const { unreadCount } = useNotificationsUnreadCount(isFounder);

  if (isFounder && user?.workspaceId) {
    return (
      <PillowCompanionProvider
        workspaceId={user.workspaceId}
        pendingApprovals={governance.pendingCount}
        unreadNotifications={unreadCount}
      >
        <DashboardShellWithCompanion isFounder={isFounder} />
      </PillowCompanionProvider>
    );
  }

  return <DashboardShellBase isFounder={isFounder} showCompanionChrome={false} />;
}

export function DashboardLayout() {
  return (
    <GlobalAssistantProvider>
      <DashboardLayoutInner />
    </GlobalAssistantProvider>
  );
}
