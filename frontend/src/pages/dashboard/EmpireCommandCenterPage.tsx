import { Link } from "react-router-dom";
import { CommandMetric, HealthGrid, type HealthItem } from "@/components/empire/HealthGrid";
import {
  CountryMarketplaceTabsPanel,
  GlobalMarketplaceDistributionPanel,
} from "@/components/empire/GlobalMarketplaceOperationsPanel";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { MissionPanel } from "@/components/empire/MissionPanel";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import {
  asArray,
  asNumber,
  asRecord,
  asString,
  formatCurrencyFromDollars,
} from "@/lib/empire-data";
import { buildMissionActions, extractBlockers } from "@/lib/mission-engine";
import { paths } from "@/routes/paths";
import styles from "./EmpireCommandCenterPage.module.css";

export function EmpireCommandCenterPage() {
  const { dashboard, ofd, brief, eyes, executive, executiveCouncil, success001, globalMarketplaceOperations, loading, error, reload } = useEmpireDashboard();

  if (loading) return <LoadingState message="Loading Empire Command Center…" />;
  if (error || !dashboard) {
    return <ErrorState message={error ?? "Command center unavailable"} onRetry={() => void reload()} />;
  }

  const missions = buildMissionActions({ dashboard, ofd, brief, eyes, executive });
  const cmdBlockers = extractBlockers({ dashboard, ofd, brief, eyes, executive });
  const awaitingKing = asArray(executiveCouncil?.recommendationsAwaitingKing).length;
  const s1Blocker = asString(asArray(success001?.commercialBlockers)[0]);
  const topBlocker = s1Blocker !== "—" ? s1Blocker : cmdBlockers[0] ?? "No critical blocker detected.";

  const revenueToday = asRecord(ofd?.revenueToday);
  const profitToday = asRecord(ofd?.profitToday);
  const cashPosition = asRecord(ofd?.cashPosition ?? ofd?.treasury);
  const businessWorkspace = asRecord(dashboard.businessOpportunityWorkspace);
  const productDiscovery = asRecord(dashboard.productDiscovery);
  const commerceOps = asRecord(dashboard.commerceOperations);
  const brands = asRecord(dashboard.brands);
  const growth = asRecord(dashboard.growth ?? executive?.growth);

  const healthItems: HealthItem[] = [
    {
      id: "stripe",
      label: "Stripe",
      status: asString(asRecord(dashboard.stripe)?.status, "NOT_CONNECTED"),
    },
    {
      id: "shopify",
      label: "Shopify",
      status: asString(
        asArray(dashboard.marketplaces)
          .map((m) => asRecord(m))
          .find((m) => asString(m?.marketplaceId) === "shopify")?.status,
        "NOT_CONNECTED",
      ),
    },
    {
      id: "cj",
      label: "CJ Dropshipping",
      status: asString(asRecord(dashboard.cj)?.status, "NOT_CONNECTED"),
    },
    {
      id: "supplier",
      label: "Supplier Pipeline",
      status: asString(asRecord(dashboard.supplier)?.status, "PARTIAL"),
    },
  ];

  for (const mp of asArray(dashboard.marketplaces)) {
    const entry = asRecord(mp);
    const id = asString(entry?.marketplaceId);
    if (id && id !== "shopify") {
      healthItems.push({
        id,
        label: asString(entry?.displayName, id),
        status: asString(entry?.status, "NOT_CONNECTED"),
      });
    }
  }

  const aiRecs = [
    ...asArray(executive?.recommendations),
    ...asArray(eyes?.executiveRecommendations),
    ...asArray(asRecord(dashboard.executiveCommandCenter)?.priorities),
  ].filter((item) => asString(item) !== "—");

  const monthlyRevenue = asNumber(asRecord(ofd?.estimatedMonthlyRevenue)?.value ?? ofd?.estimatedMonthlyRevenue);

  return (
    <EmpirePageShell
      eyebrow="Executive Command"
      title="Empire Command Center"
      description="Unified view of revenue, operations, infrastructure, and AI-driven recommendations."
      actions={
        <Link to={paths.dashboard.approvals} className="empireBtnPrimary">
          Approvals{awaitingKing > 0 ? ` (${awaitingKing})` : ""}
        </Link>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={asString(
          brief?.todaysHighestPriority,
          asString(ofd?.nextCriticalAction, "Empire operating steadily across all surfaces."),
        )}
        why={asString(
          asArray(executive?.recommendations)[0],
          asString(executiveCouncil?.ceoBriefing, "Aggregated from executive surfaces and AI recommendations."),
        )}
        next={missions[0]?.title ?? "Review AI recommendations below for the next growth move."}
        decision={
          awaitingKing > 0
            ? `${awaitingKing} council recommendation(s) await your verdict in Approvals.`
            : "No verdict pending — direct the council toward the SUCCESS-001 path."
        }
        blocker={topBlocker}
        action={{ label: "Open Approvals", to: paths.dashboard.approvals }}
      />

      <GlobalMarketplaceDistributionPanel
        dashboard={globalMarketplaceOperations}
        executiveCouncil={executiveCouncil}
      />
      <CountryMarketplaceTabsPanel dashboard={globalMarketplaceOperations} />

      <section className={styles.metricGrid}>
        <CommandMetric
          label="Revenue Today"
          value={`$${asNumber(revenueToday?.value).toFixed(2)}`}
          source={revenueToday?.source === "REAL" ? "REAL" : "SIMULATED"}
          accent
          to={paths.dashboard.operatingCost}
        />
        <CommandMetric
          label="Profit Today"
          value={`$${asNumber(profitToday?.value).toFixed(2)}`}
          source={profitToday?.source === "REAL" ? "REAL" : "SIMULATED"}
          to={paths.dashboard.operatingCost}
        />
        <CommandMetric
          label="Cash Position"
          value={
            cashPosition
              ? `$${asNumber(cashPosition?.value ?? cashPosition?.balanceCents, 0) / (cashPosition?.balanceCents ? 100 : 1)}`
              : "$—"
          }
          hint="Treasury snapshot"
          to={paths.dashboard.operatingCost}
        />
        <CommandMetric label="Orders Today" value={asNumber(commerceOps?.ordersToday)} hint="Commerce operations" to={paths.dashboard.operations} />
        <CommandMetric
          label="Businesses"
          value={asNumber(businessWorkspace?.totalOpportunities)}
          hint={`${asNumber(businessWorkspace?.approvedCount)} approved`}
          to={paths.dashboard.brands}
        />
        <CommandMetric label="Brands" value={asNumber(brands?.count ?? businessWorkspace?.approvedCount)} to={paths.dashboard.brands} />
        <CommandMetric
          label="Products"
          value={asNumber(productDiscovery?.opportunitiesDiscovered)}
          hint={`${asNumber(asRecord(dashboard.products)?.count)} listings prepared`}
          to={paths.dashboard.intelligence}
        />
        <CommandMetric
          label="Est. Monthly Revenue"
          value={monthlyRevenue > 0 ? formatCurrencyFromDollars(monthlyRevenue) : "$—"}
          to={paths.dashboard.success001}
        />
      </section>

      <HealthGrid items={healthItems} title="Infrastructure & Marketplace Health" />
      <Link to={paths.dashboard.infrastructure} className="empireBtnSecondary">
        Manage infrastructure & connectors
      </Link>

      <div className="empireGridWide">
        <section className="empireCard">
          <h2 className="empireCardTitle">Operation First Dollar</h2>
          <p className={styles.phase}>{asString(ofd?.currentPhase, "PRE_LAUNCH")}</p>
          <p className="empireCardBody">{asString(ofd?.nextCriticalAction)}</p>
          <div className={styles.ofdMeta}>
            <span>Milestones: {asNumber(asRecord(ofd?.tracker)?.achievedCount)}/{asNumber(asRecord(ofd?.tracker)?.totalCount, 8)}</span>
            <span>Growth: {asString(growth?.trend ?? growth?.label, "Tracking")}</span>
          </div>
          <Link to={paths.dashboard.success001} className="empireBtnSecondary" style={{ marginTop: "0.75rem" }}>
            Open SUCCESS-001 Command Center
          </Link>
        </section>

        <section className="empireCard">
          <h2 className="empireCardTitle">Executive Brief</h2>
          {brief ? (
            <>
              <p className={styles.briefPriority}>{asString(brief.todaysHighestPriority)}</p>
              <ul className="empireList">
                {asArray(brief.grandKingActionsToday).map((action) => (
                  <li key={asString(action)} className="empireListItem">
                    {asString(action)}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="empireCardBody">Generate a daily brief from Mission Home.</p>
          )}
          <Link to={paths.dashboard.debate} className="empireBtnSecondary" style={{ marginTop: "0.75rem" }}>
            Open Executive Debate
          </Link>
        </section>
      </div>

      <section className="empireCard">
        <h2 className="empireCardTitle">AI Recommendations</h2>
        {aiRecs.length === 0 ? (
          <p className="empireCardBody">Recommendations populate as Eye Series and Executive Command run.</p>
        ) : (
          <ul className={styles.recList}>
            {aiRecs.slice(0, 8).map((item) => (
              <li key={asString(item)}>{asString(item)}</li>
            ))}
          </ul>
        )}
        <Link to={paths.dashboard.debate} className="empireBtnSecondary" style={{ marginTop: "0.75rem" }}>
          Review in Executive Debate
        </Link>
      </section>

      <section className="empireCard">
        <h2 className="empireCardTitle">System Health</h2>
        <p className="empireCardBody">
          Empire status: {asString(dashboard.systemHealth ?? executive?.systemHealth, "OPERATIONAL")} · Launch readiness:{" "}
          {asString(asRecord(dashboard.launchReadiness)?.overallReadinessScore, "—")}
        </p>
        <Link to="/dashboard" className="empireBtnSecondary" style={{ marginTop: "0.75rem" }}>
          Return to Mission Home
        </Link>
      </section>

      <MissionPanel missions={missions} title="Command Actions" />
    </EmpirePageShell>
  );
}
