import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { AlertBanner } from "@/components/system/AlertBanner";
import { ApprovalPanel, type ApprovalItem } from "@/components/system/ApprovalPanel";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  fetchLaunchCommandCenter,
  fetchLaunchDecision,
  fetchLaunchReadiness,
  fetchPipelineProducts,
  registerPipelineProduct,
} from "@/api/launch";
import {
  decideLaunchMission,
  executeApprovedLaunch,
  fetchFollowUpMissions,
  fetchLaunchMissions,
  fetchLaunchStatusEntries,
  type FollowUpMission,
  type LaunchStatusEntry,
  type ProductLaunchMission,
} from "@/api/commerce-intelligence";
import { DEFAULT_DISCOVERY, GRAND_KING_COMPANY_ID } from "@/config/constants";
import { usePillowPageContext } from "@/context/PillowCompanionContext";
import { asNumber, asRecord, asString } from "@/lib/empire-data";
import { paths } from "@/routes/paths";

type Verdict = "approved" | "rejected";

interface PipelineRow {
  productId: string;
  title: string;
  state: string;
  lifecycleStage: string;
  category: string;
}

export function LaunchCenterPage() {
  const navigate = useNavigate();
  const [readiness, setReadiness] = useState<Record<string, unknown> | null>(null);
  const [decision, setDecision] = useState<Record<string, unknown> | null>(null);
  const [command, setCommand] = useState<Record<string, unknown> | null>(null);
  const [pipelineProducts, setPipelineProducts] = useState<Record<string, unknown>[]>([]);
  const [cicMissions, setCicMissions] = useState<ProductLaunchMission[]>([]);
  const [launchStatus, setLaunchStatus] = useState<LaunchStatusEntry[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpMission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [whyEvidence, setWhyEvidence] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [proposed, setProposed] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [trackedEntry, setTrackedEntry] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [evalRes, decisionRes, commandRes, productsRes, missionsRes, statusRes, followUpRes] = await Promise.all([
        fetchLaunchReadiness(),
        fetchLaunchDecision(),
        fetchLaunchCommandCenter(),
        fetchPipelineProducts().catch(() => ({ products: [] as Record<string, unknown>[] })),
        fetchLaunchMissions().catch(() => ({ missions: [] as ProductLaunchMission[], total: 0 })),
        fetchLaunchStatusEntries().catch(() => ({ entries: [] as LaunchStatusEntry[], total: 0 })),
        fetchFollowUpMissions().catch(() => ({ followUps: [] as FollowUpMission[], total: 0 })),
      ]);
      setReadiness(asRecord(evalRes.evaluation));
      setDecision(asRecord(decisionRes.decision));
      setCommand(commandRes);
      setPipelineProducts(productsRes.products);
      setCicMissions(missionsRes.missions);
      setLaunchStatus(statusRes.entries);
      setFollowUps(followUpRes.followUps);
      setSelectedMissionId((prev) => prev ?? missionsRes.missions[0]?.missionId ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load launch mission");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedMission = useMemo(
    () => cicMissions.find((m) => m.missionId === selectedMissionId) ?? cicMissions[0] ?? null,
    [cicMissions, selectedMissionId],
  );

  usePillowPageContext(
    useMemo(
      () => ({
        extensionId: "commerce-intelligence-core",
        workflow: "product-launch-missions",
        module: "PILLOW-020",
        selectedRecords: selectedMission
          ? [{ type: "launch-mission", id: selectedMission.missionId, label: selectedMission.creative.title }]
          : undefined,
        businessEntity: selectedMission
          ? {
              program: "PILLOW-020",
              intelligenceOwner: "pillow",
              missionId: selectedMission.missionId,
              proposalReadiness: selectedMission.proposalReadiness,
              commercialScore: selectedMission.commercialScore,
              approvalState: selectedMission.kingApproved ? "approved" : selectedMission.status,
              creativeReadiness: selectedMission.creative.mediaReadiness,
              whyEvidence: selectedMission.whyEvidence,
              supplier: "cj-dropshipping",
              marketplace: "amazon-us",
            }
          : { program: "PILLOW-020", intelligenceOwner: "pillow" },
      }),
      [selectedMission],
    ),
  );

  const cicPendingItems: ApprovalItem[] =
    selectedMission?.status === "pending_review" && selectedMission.proposalReadiness === "READY"
    ? [
        {
          id: selectedMission.missionId,
          title: selectedMission.creative.title,
          detail: `Confidence ${selectedMission.confidenceScore}/100 · ${selectedMission.expectedMarginPercent}% net margin · ${selectedMission.route} route · ${selectedMission.recommendation}`,
          meta: "Pillow Commerce Intelligence OS · PILLOW-020 · GC-02",
        },
      ]
    : [];

  async function handleCicDecision(decision: "approve" | "reject" | "defer") {
    if (!selectedMission) return;
    setBusy(true);
    try {
      await decideLaunchMission(selectedMission.missionId, decision);
      if (decision === "approve") {
        await executeApprovedLaunch(selectedMission.missionId);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mission decision failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCicWhy() {
    if (!selectedMission) return;
    setBusy(true);
    try {
      const res = await decideLaunchMission(selectedMission.missionId, "why");
      setWhyEvidence(res.whyEvidence ?? []);
    } finally {
      setBusy(false);
    }
  }

  const readinessScore = asNumber(readiness?.overallReadinessScore);
  const launchDecision = asString(decision?.launchDecision, "NOT_READY");
  const brandChoice = asString(command?.brandChoice, DEFAULT_DISCOVERY.brand);
  const category = asString(command?.category, DEFAULT_DISCOVERY.category);
  const launchTitle = `${brandChoice} · ${category}`;

  const pipelineRows = useMemo<PipelineRow[]>(
    () =>
      pipelineProducts.map((raw) => {
        const p = asRecord(raw);
        return {
          productId: asString(p?.productId, ""),
          title: asString(p?.title, "Product"),
          state: asString(p?.state, "DISCOVERED"),
          lifecycleStage: asString(p?.lifecycleStage, "—"),
          category: asString(p?.category, "—"),
        };
      }),
    [pipelineProducts],
  );

  const pendingItems: ApprovalItem[] =
    proposed && !verdict
      ? [
          {
            id: "launch-proposal",
            title: `Launch ${launchTitle}`,
            detail: `Readiness ${readinessScore}/100 · decision ${launchDecision}. Launch enters the revenue pipeline only after Grand King approval (GC-02).`,
            meta: "GKR launch pipeline · REAL-077",
          },
        ]
      : [];

  async function handleApproveLaunch() {
    setBusy(true);
    try {
      const { product } = await registerPipelineProduct({
        companyId: GRAND_KING_COMPANY_ID,
        title: launchTitle,
        category,
        supplierPlatform: "cj-dropshipping",
      });
      setTrackedEntry(product);
      setVerdict("approved");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register pipeline entry");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState message="Loading launch mission…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const pipelineColumns: ExecutiveTableColumn<PipelineRow>[] = [
    { key: "title", header: "Product", render: (row) => <strong>{row.title}</strong> },
    { key: "state", header: "Pipeline state", render: (row) => <StatusBadge status={row.state} /> },
    { key: "lifecycleStage", header: "Lifecycle", render: (row) => row.lifecycleStage },
    { key: "category", header: "Category", render: (row) => row.category },
  ];

  return (
    <EmpirePageShell
      eyebrow="Commercial Spine · UX-019 · GKR Launch Pipeline"
      title="Launch Mission"
      description="Every launch is gated. Nothing publishes until the Grand King approves — and every approved launch produces a tracked revenue-pipeline entry."
      actions={
        <>
          <Link to={paths.dashboard.brands} className="empireBtnSecondary">
            Back to Brand Workspace
          </Link>
          <Link to={paths.dashboard.infrastructure} className="empireBtnSecondary">
            Infrastructure →
          </Link>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`Launch readiness ${readinessScore}/100 · decision ${launchDecision} · ${pipelineRows.length} product(s) in the revenue pipeline.`}
        why="Launches must be governed and traceable — every product enters the GKR pipeline with a tracked lifecycle toward SUCCESS-001."
        next={
          pendingItems.length > 0
            ? "Approve or reject the proposed launch in the governance queue."
            : verdict === "approved"
              ? "Launch registered — monitor the pipeline entry through Commerce Operations."
              : "Review readiness, then propose a launch for Grand King approval."
        }
        decision={
          pendingItems.length > 0
            ? "1 launch awaiting your verdict (GC-02)."
            : verdict === "approved"
              ? "Launch approved — pipeline entry tracked."
              : "No launch decision pending."
        }
        blocker={
          launchDecision === "NOT_READY"
            ? "Launch not ready — resolve readiness blockers first."
            : "Launch gated on Grand King approval (GC-02)."
        }
        action={{ label: "Open Approvals", to: paths.dashboard.approvals }}
      />

      <AlertBanner
        severity="info"
        title="Launch is gated — no ungated publish (GC-02)"
        message="Pillow Commerce Intelligence prepares missions. Launch automation executes only after Grand King approval — nothing publishes without a verdict."
        action={{ label: "Grand King Approvals", to: paths.dashboard.approvals }}
      />

      <ExecutivePanel title="Product Launch Missions" eyebrow="Pillow Commerce Intelligence OS · PILLOW-020" variant="accent">
        {cicMissions.length === 0 ? (
          <p className="empireEmpty">
            No launch missions yet.{" "}
            <Link to={paths.dashboard.intelligence}>Pull CJ products</Link> to generate approval-ready missions.
          </p>
        ) : (
          <>
            <div className="empireToolbar">
              <select
                className="empireSelect"
                value={selectedMission?.missionId ?? ""}
                onChange={(e) => setSelectedMissionId(e.target.value)}
              >
                {cicMissions.map((m) => (
                  <option key={m.missionId} value={m.missionId}>
                    {m.creative.title} · {m.status}
                  </option>
                ))}
              </select>
            </div>
            {selectedMission && (
              <>
                <ExecutiveKpiGrid>
                  <ExecutiveKpiCard
                    label="Confidence"
                    value={`${selectedMission.confidenceScore}/100`}
                    source="CIC"
                    health={selectedMission.confidenceScore >= 70 ? "ok" : "warning"}
                    hint={selectedMission.recommendation}
                    accent
                  />
                  <ExecutiveKpiCard
                    label="Net margin"
                    value={`${selectedMission.expectedMarginPercent}%`}
                    source="CIC"
                    health={selectedMission.expectedMarginPercent >= 18 ? "ok" : "critical"}
                    hint={`$${selectedMission.expectedNetProfitRangeUsd.min}–$${selectedMission.expectedNetProfitRangeUsd.max} per unit`}
                  />
                  <ExecutiveKpiCard
                    label="Route"
                    value={selectedMission.route}
                    source="CIC"
                    health="neutral"
                    hint={selectedMission.productFit.routeRationale}
                  />
                  <ExecutiveKpiCard
                    label="CEO / CTO lens"
                    value={`${selectedMission.ceoLens.overallScore} / ${selectedMission.ctoLens.overallScore}`}
                    source="CIC"
                    health="neutral"
                    hint="Executive perspectives before Grand King review"
                  />
                </ExecutiveKpiGrid>
                <p className="empireCardBody" style={{ marginTop: "var(--space-3)" }}>
                  <strong>Why this product:</strong> {selectedMission.whyThisProduct}
                </p>
                <p className="empireCardBody">
                  <strong>Why this market:</strong> {selectedMission.whyThisMarket}
                </p>
                <p className="empireCardBody">
                  <strong>Why now:</strong> {selectedMission.whyNow}
                </p>
                <details className="empireDetails" style={{ marginTop: "var(--space-3)" }}>
                  <summary className="empireDetailsSummary">Creative preview</summary>
                  <div className="empireDetailsBody">
                    <p className="cardMeta">{selectedMission.creative.productDescription}</p>
                    <ul className="empireList">
                      {selectedMission.creative.bulletPoints.map((b, i) => (
                        <li key={i} className="empireListItem">{b}</li>
                      ))}
                    </ul>
                    {selectedMission.route === "shopify" && (
                      <p className="cardMeta">{selectedMission.creative.shopifyBrandCopy}</p>
                    )}
                  </div>
                </details>
                <ApprovalPanel
                  title="Grand King Mission Verdict (GC-02)"
                  items={cicPendingItems}
                  emptyMessage={
                    selectedMission.proposalReadiness === "NOT_READY"
                      ? "Proposal NOT READY — CEO/CTO lenses must pass before Grand King approval."
                      : selectedMission.kingApproved
                      ? "Mission approved — launch automation available or completed."
                      : selectedMission.status === "rejected"
                        ? "Mission rejected."
                        : selectedMission.status === "deferred"
                          ? "Mission deferred."
                          : "No pending mission selected."
                  }
                  disabled={busy}
                  onApprove={() => void handleCicDecision("approve")}
                  onReject={() => void handleCicDecision("reject")}
                  onInvestigate={() => void handleCicWhy()}
                />
                {whyEvidence.length > 0 && (
                  <ul className="empireList" style={{ marginTop: "var(--space-3)" }}>
                    {whyEvidence.map((e, i) => (
                      <li key={i} className="empireListItem">{e}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </ExecutivePanel>

      <ExecutivePanel title="Follow-up Missions" eyebrow="Performance monitoring · approval-gated execution">
        {followUps.length === 0 ? (
          <p className="empireEmpty">No follow-up missions yet — generated after launch monitoring runs.</p>
        ) : (
          <ul className="empireList">
            {followUps.map((f) => (
              <li key={f.followUpId} className="empireListItem">
                <strong>{f.title}</strong> · {f.type.replace(/_/g, " ")} ·{" "}
                <StatusBadge status={f.status} /> — {f.rationale}
              </li>
            ))}
          </ul>
        )}
      </ExecutivePanel>

      <ExecutivePanel title="Launch Status" eyebrow="Approved · publishing · live · monitoring · blocked">
        <ExecutiveTable
          columns={[
            { key: "title", header: "Product", render: (row) => <strong>{row.title}</strong> },
            { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
            { key: "route", header: "Route", render: (row) => row.route },
            { key: "lastEvent", header: "Last event", render: (row) => row.lastEvent },
          ]}
          rows={launchStatus}
          getRowKey={(row) => row.missionId}
          emptyMessage="No launch status entries — approve a mission to begin approval-gated automation."
        />
      </ExecutivePanel>

      <AlertBanner
        severity="info"
        title="GKR launch pipeline (legacy)"
        message="Legacy launch readiness flow below — Pillow Commerce Intelligence missions above are the primary approval path for CJ → Amazon US V1."
        action={{ label: "Product Intelligence Queue", to: paths.dashboard.intelligence }}
      />

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard
          label="Launch readiness"
          value={`${readinessScore}/100`}
          source="REAL"
          health={readinessScore >= 70 ? "ok" : readinessScore >= 40 ? "warning" : "critical"}
          hint={asString(decision?.rationale, "Commerce readiness evaluation")}
          accent
        />
        <ExecutiveKpiCard
          label="Launch decision"
          value={launchDecision.replace(/_/g, " ")}
          source="REAL"
          health={launchDecision === "READY" || launchDecision === "GO" ? "ok" : "warning"}
          hint={`Phase: ${asString(command?.currentPhase, "—")}`}
        />
        <ExecutiveKpiCard
          label="Pipeline entries"
          value={pipelineRows.length}
          source="REAL"
          health="neutral"
          hint="Tracked products in GKR pipeline"
        />
      </ExecutiveKpiGrid>

      <ExecutivePanel title="Launch Readiness" eyebrow="Commerce readiness + launch decision">
        <p className="empireCardBody">{asString(decision?.rationale, "Awaiting readiness evaluation.")}</p>
        <p className="empireMetricHint" style={{ marginTop: "0.5rem" }}>
          Objective: USD 100,000 net profit · Brand: {brandChoice} · Category: {category}
        </p>
        {!proposed && !verdict && (
          <div className="empireToolbar" style={{ marginTop: "var(--space-4)" }}>
            <button
              type="button"
              className="empireBtnPrimary"
              disabled={busy || launchDecision === "NOT_READY"}
              onClick={() => setProposed(true)}
            >
              Propose launch →
            </button>
          </div>
        )}
      </ExecutivePanel>

      <ExecutivePanel
        title="Pending Grand King Approval (GC-02)"
        eyebrow="No launch executes without a verdict"
        variant={pendingItems.length > 0 ? "accent" : "muted"}
      >
        <ApprovalPanel
          title="Launch Awaiting Approval"
          items={pendingItems}
          emptyMessage={
            verdict === "approved"
              ? "Launch approved — pipeline entry created below."
              : "No launch proposed. Use “Propose launch” to stage a governed launch."
          }
          disabled={busy}
          onApprove={() => void handleApproveLaunch()}
          onReject={() => setVerdict("rejected")}
          onInvestigate={() => navigate(paths.dashboard.approvals)}
        />
        {verdict && (
          <p className="empireMetricHint" style={{ marginTop: "var(--space-3)" }}>
            Verdict:{" "}
            <StatusBadge
              status={verdict === "approved" ? "APPROVED" : "REJECTED"}
              label={verdict === "approved" ? "Approved · pipeline entry tracked" : "Rejected"}
            />
            {trackedEntry && (
              <>
                {" "}
                · Product ID {asString(trackedEntry.productId)} · state{" "}
                {asString(trackedEntry.state, "DISCOVERED")}
              </>
            )}
          </p>
        )}
      </ExecutivePanel>

      <ExecutivePanel title="Tracked Pipeline Entries" eyebrow="GKR revenue pipeline · REAL-077">
        <ExecutiveTable
          columns={pipelineColumns}
          rows={pipelineRows}
          getRowKey={(row) => row.productId}
          emptyMessage="No pipeline entries yet — approve a launch to create the first tracked entry."
        />
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
