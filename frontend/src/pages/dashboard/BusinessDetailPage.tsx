import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { MissionPanel } from "@/components/empire/MissionPanel";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  approveBusinessOpportunity,
  fetchBusinessOpportunities,
  rejectBusinessOpportunity,
} from "@/api/business";
import { brainDispatch } from "@/api/dispatch";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import { buildMissionActions } from "@/lib/mission-engine";
import { paths } from "@/routes/paths";
import styles from "./BusinessDetailPage.module.css";

export function BusinessDetailPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const [opportunity, setOpportunity] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [proposed, setProposed] = useState(false);
  const empire = useEmpireDashboard();
  const { user } = useAuth();

  // UX-018: operator persona is brand-scoped — no Grand King governance controls.
  const isOperator = user?.role === "operator";

  const load = useCallback(async () => {
    if (!opportunityId) return;
    setLoading(true);
    setError(null);
    try {
      const { opportunities } = await fetchBusinessOpportunities();
      const match = opportunities.find((o) => asString(o.businessOpportunityId) === opportunityId);
      setOpportunity(match ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load business");
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState message="Entering brand headquarters…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!opportunity) {
    return <ErrorState message="Business not found" onRetry={() => void load()} />;
  }

  const brand = asRecord(opportunity.brand);
  const economics = asRecord(opportunity.economics);
  const assets = asRecord(opportunity.assetsPreview);
  const marketplaceRec = asRecord(economics?.marketplaceRecommendation ?? opportunity.marketplaceRecommendation);
  const missions = buildMissionActions({
    dashboard: empire.dashboard,
    ofd: empire.ofd,
    brief: empire.brief,
    eyes: empire.eyes,
    executive: empire.executive,
  }).filter((m) => m.category === "brand" || m.category === "launch");

  async function handleApprove() {
    if (!opportunityId) return;
    setBusy(true);
    try {
      await approveBusinessOpportunity(opportunityId);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (!opportunityId) return;
    setBusy(true);
    try {
      await rejectBusinessOpportunity(opportunityId, "Rejected from Brand HQ");
      await load();
    } finally {
      setBusy(false);
    }
  }

  // Operator action: propose (not approve) — reuses the owner's non-approval "save" action.
  async function handlePropose() {
    if (!opportunityId) return;
    setBusy(true);
    try {
      await brainDispatch("business-opportunity-workspace", "save", GRAND_KING_COMPANY_ID, {
        businessOpportunityId: opportunityId,
        actor: user?.email ?? "operator",
        notes: "Proposed by operator from Brand HQ (UX-018) — awaiting Grand King review",
      });
      setProposed(true);
    } finally {
      setBusy(false);
    }
  }

  const sections = [
    { title: "Brand Identity", items: [
      ["Business name", asString(brand?.businessName)],
      ["Category", asString(brand?.category)],
      ["Brand confidence", `${asNumber(brand?.brandConfidence)}/100`],
      ["Positioning", asString(brand?.brand)],
    ]},
    { title: "Products & Margins", items: [
      ["Product", asString(economics?.productName)],
      ["Expected ROI", `${asNumber(opportunity.expectedRoi).toFixed(1)}%`],
      ["Launch confidence", `${asNumber(opportunity.launchConfidence)}%`],
      ["Domination score", `${asNumber(opportunity.dominationScore)}`],
    ]},
    { title: "Marketplaces", items: [
      ["Primary", asString(marketplaceRec?.recommendedMarketplace ?? marketplaceRec?.primaryMarketplace)],
      ["Secondary", asString(marketplaceRec?.secondaryMarketplace, "shopify")],
      ["Expansion", asArray(marketplaceRec?.futureExpansionMarketplaces).join(", ") || "—"],
    ]},
    { title: "Launch Readiness", items: [
      ["Status", asString(opportunity.status, "CANDIDATE")],
      ["Listing title", asString(assets?.listingTitle)],
      ["Expansion", asString(opportunity.expansionPotential, "—")],
    ]},
    { title: "Performance", items: [
      ["Strategy fit", asString(opportunity.strategyFit, "—")],
      ["Risk level", asString(opportunity.riskLevel, "MEDIUM")],
      ["Time to launch", asString(opportunity.estimatedTimeToLaunch, "—")],
    ]},
    { title: "Recommendations", items: [
      ["Next action", asString(opportunity.recommendedNextAction, "Approve or generate preview")],
      ["Why", asString(opportunity.recommendationRationale, "High domination score with strong economics.")],
    ]},
  ];

  return (
    <EmpirePageShell
      eyebrow="Brand Headquarters"
      title={asString(brand?.businessName, "Business")}
      description={asString(assets?.listingDescription, "Living company workspace — brand, products, marketplaces, and launch path.")}
      actions={
        <>
          <Link to={paths.dashboard.businessPreview(opportunityId!)} className="empireBtnSecondary">
            Preview
          </Link>
          {isOperator ? (
            <button
              type="button"
              className="empireBtnPrimary"
              disabled={busy || proposed}
              onClick={() => void handlePropose()}
            >
              {proposed ? "Proposed ✓" : "Propose to Grand King"}
            </button>
          ) : (
            <button type="button" className="empireBtnPrimary" disabled={busy} onClick={() => void handleApprove()}>
              Approve
            </button>
          )}
        </>
      }
    >
      <div className={styles.hero}>
        <StatusBadge status={asString(opportunity.status, "CANDIDATE")} />
        <span className={styles.heroMeta}>
          {asString(economics?.productName)} · ROI {asNumber(opportunity.expectedRoi).toFixed(1)}
        </span>
      </div>

      <div className={styles.grid}>
        {sections.map((section) => (
          <section key={section.title} className="empireCard">
            <h2 className="empireCardTitle">{section.title}</h2>
            <dl className={styles.dl}>
              {section.items.map(([label, value]) => (
                <div key={label} className={styles.row}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {!isOperator && <MissionPanel missions={missions} title="Brand Missions" compact />}

      <div className={styles.footerActions}>
        <Link to={paths.dashboard.brands} className="empireBtnGhost">
          ← All brands
        </Link>
        {!isOperator && (
          <button type="button" className="empireBtnSecondary" disabled={busy} onClick={() => void handleReject()}>
            Reject business
          </button>
        )}
      </div>
    </EmpirePageShell>
  );
}
