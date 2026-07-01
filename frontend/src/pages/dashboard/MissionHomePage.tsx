import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { generateDailyBrief } from "@/api/dashboard";
import {
  fetchNotifications,
  syncNotifications,
  TYPE_LABELS,
  type GlobalNotification,
} from "@/api/notifications";
import { BlockerPanel, MissionPanel } from "@/components/empire/MissionPanel";
import { CommandMetric } from "@/components/empire/HealthGrid";
import { OperatingCostPanel } from "@/components/empire/OperatingCostPanel";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useGlobalAssistant } from "@/context/GlobalAssistantContext";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import {
  asArray,
  asNumber,
  asRecord,
  asString,
  formatCurrencyFromDollars,
  greetingForHour,
} from "@/lib/empire-data";
import { buildMissionActions, extractBlockers } from "@/lib/mission-engine";
import { loadOperatingCost, overallOperatingCost, type OperatingCostItem } from "@/lib/operating-cost";
import { paths } from "@/routes/paths";
import styles from "./MissionHomePage.module.css";

type Tone = "ok" | "warn" | "crit" | "info";

function toneFromNotificationType(type: GlobalNotification["type"]): Tone {
  if (type === "critical" || type === "error") return "crit";
  if (type === "warning" || type === "executive") return "warn";
  if (type === "success") return "ok";
  return "info";
}

function toneFromHealth(health: string): Tone {
  const value = health.toUpperCase();
  if (["STABLE", "HEALTHY", "GROWING", "ACTIVE"].includes(value)) return "ok";
  if (value === "WARNING") return "warn";
  if (["CRITICAL", "FAILED"].includes(value)) return "crit";
  return "info";
}

function SummaryStat({
  to,
  label,
  value,
  hint,
  tone,
  onWhy,
}: {
  to: string;
  label: string;
  value: ReactNode;
  hint: string;
  tone: Tone;
  onWhy?: (label: string, value: string) => void;
}) {
  return (
    <div className={`empireCard ${styles.summaryCard}`} data-tone={tone}>
      <Link to={to} className={styles.summaryLink}>
        <span className={styles.summaryLabel}>{label}</span>
        <span className={styles.summaryValue}>{value}</span>
        <span className={styles.summaryHint}>{hint} →</span>
      </Link>
      {onWhy && (
        <button
          type="button"
          className={styles.whyButton}
          onClick={() => onWhy(label, String(value))}
        >
          Why?
        </button>
      )}
    </div>
  );
}

export function MissionHomePage() {
  const { user } = useAuth();
  const { askWhy } = useGlobalAssistant();
  const {
    dashboard,
    ofd,
    brief,
    eyes,
    executive,
    success001,
    executiveSurveillance,
    grandKingAccount,
    grandKingRevenuePipeline,
    loading,
    error,
    reload,
  } = useEmpireDashboard();

  const [opCostItems, setOpCostItems] = useState<OperatingCostItem[]>(() => loadOperatingCost());
  const [showOpCost, setShowOpCost] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState<GlobalNotification[]>([]);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        await syncNotifications();
        const result = await fetchNotifications({ limit: 6 });
        const critical = result.notifications?.filter((n) =>
          ["critical", "error", "warning", "executive"].includes(n.type),
        );
        setLiveNotifications((critical?.length ? critical : result.notifications)?.slice(0, 6) ?? []);
        setNotificationsError(null);
      } catch {
        setLiveNotifications([]);
        setNotificationsError("Notifications unavailable");
      }
    })();
  }, []);

  if (loading) return <LoadingState message="Preparing your mission briefing…" />;
  if (error || !dashboard) {
    return <ErrorState message={error ?? "Mission control unavailable"} onRetry={() => void reload()} />;
  }

  const kingName = user?.role === "founder" || user?.role === "admin" ? "King" : user?.name?.split(" ")[0] ?? "King";

  const missions = buildMissionActions({ dashboard, ofd, brief, eyes, executive });
  const blockers = extractBlockers({ dashboard, ofd, brief, eyes, executive });
  const topMission = missions[0];

  // SUCCESS-001 — the single mission (REAL-035)
  const s1Progress = asNumber(success001?.progressPercent);
  const s1NetProfit = asNumber(success001?.currentNetProfitUsd);
  const s1Distance = asNumber(success001?.distanceToTargetUsd, 100000);
  const empireHealth = asString(success001?.empireHealth, "UNKNOWN");
  const businessHealth = asString(success001?.businessHealth, "UNKNOWN");
  const s1Blockers = [
    ...asArray(success001?.commercialBlockers),
    ...asArray(success001?.operationalBlockers),
    ...asArray(success001?.supplierBlockers),
    ...asArray(success001?.marketplaceBlockers),
  ]
    .map((entry) => asString(entry))
    .filter((entry) => entry !== "—");
  const topS1Blocker = s1Blockers[0] ?? blockers[0] ?? "No blocker detected — keep momentum.";

  // Executive surveillance (ESS)
  const essHealth = asRecord(executiveSurveillance?.empireHealth);
  const essMorning = asRecord(executiveSurveillance?.ceoMorningBrief);
  const essSignals = asArray(asRecord(executiveSurveillance?.executiveSurveillance)?.signals);
  const essCriticalRisks = asArray(executiveSurveillance?.criticalRisks);

  // Revenue / economics
  const revenueToday = asRecord(ofd?.revenueToday);
  const revenueTodayValue = asNumber(revenueToday?.value);
  const monthlyRevenue = asNumber(asRecord(ofd?.estimatedMonthlyRevenue)?.value ?? ofd?.estimatedMonthlyRevenue);
  const revenueSource: "REAL" | "SIMULATED" =
    asString(revenueToday?.source, "SIMULATED").toUpperCase() === "REAL" ? "REAL" : "SIMULATED";

  // Grand King account counts
  const gkSummary = asRecord(grandKingAccount?.summary);
  const orders = asNumber(gkSummary?.orderCount, asArray(grandKingAccount?.orders).length);
  const products = asNumber(gkSummary?.productCount, asArray(grandKingAccount?.products).length);
  const suppliers = asArray(grandKingAccount?.suppliers).length;

  const marketplaces = asArray(dashboard.marketplaces).map((entry) => asRecord(entry));
  const marketplacesConnected = marketplaces.filter((m) => asString(m?.status) === "CONNECTED").length;

  // Approvals awaiting the King
  const gkrPipeline = asRecord(grandKingRevenuePipeline?.currentRevenuePipeline);
  const awaitingApproval =
    asArray(gkrPipeline?.awaitingApproval).length + asArray(success001?.grandKingApprovalQueue).length;

  // Operating cost (King-editable, localStorage-backed)
  const opCostOverall = overallOperatingCost(opCostItems);

  const criticalAlerts = essCriticalRisks.length + blockers.length;

  const notifications = liveNotifications.map((notification) => ({
    id: notification.notificationId,
    text: notification.title,
    to: notification.deepLink,
    tone: toneFromNotificationType(notification.type),
    typeLabel: TYPE_LABELS[notification.type],
  }));

  const happenedToday = asString(
    brief?.todaysHighestPriority,
    asString(essMorning?.summary, asString(ofd?.nextCriticalAction, "Empire is steady — review opportunities.")),
  );
  const whatChanged = `Revenue today ${formatCurrencyFromDollars(revenueTodayValue)} · Net profit ${formatCurrencyFromDollars(s1NetProfit)} · ${products} products · ${marketplacesConnected}/${marketplaces.length} marketplaces live`;
  const needsAttention = topMission ? topMission.title : topS1Blocker;

  const shortcuts: Array<{ label: string; to: string }> = [
    { label: "SUCCESS-001", to: paths.dashboard.success001 },
    { label: "Product Discovery", to: paths.dashboard.intelligence },
    { label: "Supplier Intelligence", to: paths.dashboard.infrastructureSuppliers },
    { label: "Marketplace Intelligence", to: paths.dashboard.infrastructureMarketplaces },
    { label: "Executive Debate", to: paths.dashboard.command },
    { label: "Reports", to: paths.dashboard.command },
  ];

  async function handleGenerateBrief() {
    await generateDailyBrief();
    await reload();
  }

  return (
    <EmpirePageShell
      eyebrow={greetingForHour()}
      title={`Mission Home — ${kingName}`}
      description={asString(
        essMorning?.summary,
        asString(executive?.ceoBriefing, "Watchers observe — Council debates — you decide."),
      )}
      actions={
        <Link to={paths.dashboard.command} className="empireBtnSecondary">
          Open Command Center
        </Link>
      }
    >
      {/* 1 — Executive Summary */}
      <section className={styles.summaryRow}>
        <SummaryStat
          to={paths.dashboard.command}
          label="Empire Health"
          value={empireHealth.replace(/_/g, " ")}
          hint={`${asNumber(essHealth?.overallScore)}% · ${asNumber(essHealth?.modulesWatched)} watched`}
          tone={toneFromHealth(empireHealth)}
          onWhy={askWhy}
        />
        <SummaryStat
          to={paths.dashboard.success001}
          label="SUCCESS-001"
          value={`${s1Progress}%`}
          hint={`${formatCurrencyFromDollars(s1Distance)} to $100K`}
          tone={s1Progress > 0 ? "info" : "warn"}
          onWhy={askWhy}
        />
        <SummaryStat
          to={paths.dashboard.command}
          label="Active Investigations"
          value={essSignals.length}
          hint="surveillance signals"
          tone={essSignals.length > 0 ? "info" : "ok"}
          onWhy={askWhy}
        />
        <SummaryStat
          to={paths.dashboard.success001}
          label="Critical Alerts"
          value={criticalAlerts}
          hint="risks + blockers"
          tone={criticalAlerts > 0 ? "crit" : "ok"}
          onWhy={askWhy}
        />
        <SummaryStat
          to={paths.dashboard.success001}
          label="Pending Approvals"
          value={awaitingApproval}
          hint="awaiting King"
          tone={awaitingApproval > 0 ? "warn" : "ok"}
          onWhy={askWhy}
        />
      </section>

      {/* 2 — Today's Mission + SUCCESS-001 */}
      <section className={styles.heroRow}>
        <article className={`empireCard ${styles.missionHero}`}>
          <p className="empireEyebrow">Today&apos;s Mission · What to do next</p>
          {topMission ? (
            <>
              <h2 className={styles.missionTitle}>{topMission.title}</h2>
              <p className={styles.missionWhy}>{topMission.why}</p>
              {topMission.href && (
                <Link to={topMission.href} className="empireBtnPrimary">
                  Execute mission
                </Link>
              )}
            </>
          ) : (
            <p className="empireCardBody">Empire is aligned — review the command center for growth opportunities.</p>
          )}
          <p className={styles.blockerLine}>
            <span>Blocking SUCCESS-001:</span> {topS1Blocker}
          </p>
        </article>

        <article className={`empireCard ${styles.s1Card}`}>
          <p className="empireEyebrow">SUCCESS-001 · USD 100K Net Profit</p>
          <span className={styles.s1Value}>{formatCurrencyFromDollars(s1NetProfit)}</span>
          <div className="empireProgress" aria-hidden="true">
            <div className="empireProgressBar" style={{ width: `${Math.min(100, s1Progress)}%` }} />
          </div>
          <p className="empireMetricHint">
            {s1Progress}% · {formatCurrencyFromDollars(s1Distance)} to target
          </p>
          <div className={styles.badgeRow}>
            <StatusBadge status={businessHealth} />
            <StatusBadge status={empireHealth} />
          </div>
          <Link to={paths.dashboard.success001} className="empireBtnSecondary">
            Open SUCCESS-001
          </Link>
        </article>
      </section>

      {/* 3 — Executive KPIs */}
      <section>
        <h2 className={styles.sectionTitle}>Executive KPIs</h2>
        <div className="empireGridMetrics">
          <CommandMetric
            label="Revenue (Monthly est.)"
            value={monthlyRevenue > 0 ? formatCurrencyFromDollars(monthlyRevenue) : "$—"}
            hint={`Today ${formatCurrencyFromDollars(revenueTodayValue)}`}
            source={revenueSource}
            accent
          />
          <CommandMetric
            label="Net Profit"
            value={formatCurrencyFromDollars(s1NetProfit)}
            hint={`${s1Progress}% to SUCCESS-001`}
            source={revenueSource}
          />
          <CommandMetric label="Orders" value={orders} hint="Lifetime orders" />
          <CommandMetric label="Active Products" value={products} hint="In catalog" />
          <CommandMetric label="Suppliers" value={suppliers} hint="Connected suppliers" />
          <CommandMetric
            label="Marketplaces"
            value={`${marketplacesConnected}/${marketplaces.length}`}
            hint="Connected / total"
          />
          <CommandMetric label="Ads" value="—" hint="No ad campaigns connected" />
          <CommandMetric
            label="Operating Cost"
            value={opCostOverall > 0 ? formatCurrencyFromDollars(opCostOverall) : "$—"}
            hint="Monthly · click to edit"
          />
        </div>
      </section>

      {/* 5 — Executive Shortcuts + Operating Cost toggle */}
      <section>
        <h2 className={styles.sectionTitle}>Executive Shortcuts</h2>
        <div className={styles.shortcutRow}>
          {shortcuts.map((shortcut) => (
            <Link key={shortcut.label} to={shortcut.to} className="empireBtnSecondary">
              {shortcut.label}
            </Link>
          ))}
          <button
            type="button"
            className="empireBtnPrimary"
            aria-expanded={showOpCost}
            onClick={() => setShowOpCost((value) => !value)}
          >
            {showOpCost ? "Hide" : "Operating Cost"}
          </button>
        </div>
      </section>

      {/* 4 — Operating Cost table */}
      {showOpCost && <OperatingCostPanel items={opCostItems} onChange={setOpCostItems} />}

      {/* 2 / 7 — Mission Briefing + Next Actions */}
      <div className="empireGridWide">
        <section className="empireCard">
          <h2 className="empireCardTitle">Mission Briefing</h2>
          <div className={styles.briefList}>
            <div className={styles.briefItem}>
              <span className={styles.briefLabel}>What happened today</span>
              <p className={styles.briefText}>{happenedToday}</p>
            </div>
            <div className={styles.briefItem}>
              <span className={styles.briefLabel}>What changed</span>
              <p className={styles.briefText}>{whatChanged}</p>
            </div>
            <div className={styles.briefItem}>
              <span className={styles.briefLabel}>What needs attention</span>
              <p className={styles.briefText}>{needsAttention}</p>
            </div>
          </div>
          <button type="button" className="empireBtnSecondary" style={{ marginTop: "1rem" }} onClick={() => void handleGenerateBrief()}>
            Generate brief
          </button>
        </section>

        <MissionPanel missions={missions} title="Recommended Next Actions" compact />
      </div>

      {/* 6 — Blockers + Critical Notifications */}
      <div className="empireGridWide">
        <BlockerPanel blockers={blockers} />
        <section className="empireCard">
          <h2 className="empireCardTitle">Critical Notifications</h2>
          {notificationsError ? (
            <p className="empireCardBody">{notificationsError}</p>
          ) : notifications.length === 0 ? (
            <p className="empireCardBody">No business-critical notifications.</p>
          ) : (
            <ul className="empireList">
              {notifications.map((notification) => (
                <li key={notification.id} className={styles.notifItem} data-tone={notification.tone}>
                  <Link to={notification.to} className={styles.notifLink}>
                    {notification.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </EmpirePageShell>
  );
}

/** @deprecated Alias for MissionHomePage */
export const GrandKingDashboardPage = MissionHomePage;
