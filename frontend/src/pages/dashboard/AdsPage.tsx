import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { AlertBanner } from "@/components/system/AlertBanner";
import { ApprovalPanel, type ApprovalItem } from "@/components/system/ApprovalPanel";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { asArray, asNumber, asRecord, asString } from "@/lib/empire-data";
import { paths } from "@/routes/paths";

type Verdict = "approved" | "rejected";

interface AdRow {
  id: string;
  platform: string;
  campaign: string;
  roas: number;
  cac: number;
  roi: number;
  budgetUsd: number;
  rationale: string;
}

function usd(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

export function AdsPage() {
  const { globalAdvertisingIntelligence, loading, error, reload } = useEmpireDashboard();
  const navigate = useNavigate();
  const [proposed, setProposed] = useState<Record<string, true>>({});
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});

  const recommendOnly = globalAdvertisingIntelligence?.recommendOnly !== false;
  const summary = asRecord(globalAdvertisingIntelligence?.summary);

  const rows = useMemo<AdRow[]>(() => {
    return asArray(globalAdvertisingIntelligence?.recommendations)
      .map((r) => asRecord(r))
      .map((r, i) => ({
        id: asString(r?.platform ?? `ad-${i}`),
        platform: asString(r?.platform, "Platform"),
        campaign: asString(r?.campaignType ?? r?.campaign, "—"),
        roas: asNumber(r?.expectedRoas ?? r?.roas),
        cac: asNumber(r?.expectedCacUsd ?? r?.cac),
        roi: asNumber(r?.expectedRoiPercent ?? r?.roi),
        budgetUsd: asNumber(r?.budgetUsd ?? r?.budget),
        rationale: asString(r?.rationale, "Recommended allocation"),
      }));
  }, [globalAdvertisingIntelligence]);

  if (loading) return <LoadingState message="Loading advertising intelligence…" />;
  if (error) return <ErrorState message={error} onRetry={() => void reload()} />;

  const pendingItems: ApprovalItem[] = rows
    .filter((row) => proposed[row.id] && !verdicts[row.id])
    .map((row) => ({
      id: row.id,
      title: `Set ${row.platform} budget to ${usd(row.budgetUsd)}`,
      detail: `${row.campaign} · expected ROAS ${row.roas}x. Money moves only after Grand King approval (GC-02).`,
      meta: "Gated spend change · REAL-038",
    }));

  const decided = rows.filter((row) => proposed[row.id] && verdicts[row.id]);

  const avgRoas = asNumber(summary?.avgExpectedRoas) || (rows.length
    ? Math.round((rows.reduce((s, r) => s + r.roas, 0) / rows.length) * 10) / 10
    : 0);
  const totalBudget = asNumber(summary?.totalRecommendedBudgetUsd) || rows.reduce((s, r) => s + r.budgetUsd, 0);
  const topPlatform = asString(summary?.topPlatform, rows[0]?.platform ?? "—");

  const columns: ExecutiveTableColumn<AdRow>[] = [
    { key: "platform", header: "Platform", render: (row) => <strong>{row.platform}</strong> },
    { key: "campaign", header: "Campaign", render: (row) => row.campaign },
    { key: "roas", header: "Expected ROAS", align: "right", render: (row) => `${row.roas}x` },
    { key: "cac", header: "CAC", align: "right", render: (row) => usd(row.cac) },
    { key: "roi", header: "ROI", align: "right", render: (row) => `${row.roi}%` },
    { key: "budgetUsd", header: "Budget", align: "right", render: (row) => usd(row.budgetUsd) },
    {
      key: "action",
      header: "Spend change",
      align: "right",
      render: (row) =>
        verdicts[row.id] ? (
          <StatusBadge status={verdicts[row.id] === "approved" ? "APPROVED" : "REJECTED"} />
        ) : proposed[row.id] ? (
          <StatusBadge status="PENDING" label="Awaiting approval" />
        ) : (
          <button
            type="button"
            className="empireBtnSecondary"
            onClick={() => setProposed((prev) => ({ ...prev, [row.id]: true }))}
          >
            Propose spend →
          </button>
        ),
    },
  ];

  return (
    <EmpirePageShell
      eyebrow="Commercial Spine · UX-008 · REAL-038"
      title="Advertising"
      description="ROAS and spend efficiency across ad platforms. Spend changes are recommendations until the Grand King approves them."
      actions={
        <>
          <Link to={paths.dashboard.marketplaces} className="empireBtnSecondary">
            Back to Marketplace Intelligence
          </Link>
          <Link to={paths.dashboard.operations} className="empireBtnPrimary">
            Commerce Operations →
          </Link>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`${rows.length} platform recommendation(s) · avg expected ROAS ${avgRoas}x · ${usd(totalBudget)} recommended budget.`}
        why="Spend efficiency (ROAS/CAC/ROI) decides which channels earn more budget — and which get cut."
        next={
          pendingItems.length > 0
            ? "Approve or reject the proposed spend changes in the governance queue."
            : "Review platform efficiency, then propose a spend change for approval."
        }
        decision={
          pendingItems.length > 0
            ? `${pendingItems.length} spend change(s) awaiting your verdict (GC-02).`
            : "No spend change pending. Propose one to move budget."
        }
        blocker={
          recommendOnly
            ? "Recommend-only mode — no ad money moves without Grand King approval."
            : "Live spend enabled — every change still routes through GC-02."
        }
      />

      <AlertBanner
        severity="info"
        title="Governed spend — no ungated money move (GC-02)"
        message="Advertising is recommend-only (REAL-038). Proposing a spend change stages it for Grand King approval; budget moves only after a verdict is recorded."
        action={{ label: "Open Approvals", to: paths.dashboard.approvals }}
      />

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard label="Avg expected ROAS" value={`${avgRoas}x`} health="ok" source="REAL" hint="Across recommended platforms" />
        <ExecutiveKpiCard label="Recommended budget" value={usd(totalBudget)} health="neutral" source="REAL" hint="Total proposed allocation" />
        <ExecutiveKpiCard label="Top platform" value={topPlatform} health="ok" source="REAL" hint="Highest expected ROAS" />
      </ExecutiveKpiGrid>

      <ExecutivePanel
        title="Spend Efficiency by Platform"
        eyebrow="REAL-038 — ROAS / CAC / ROI per channel"
      >
        <ExecutiveTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          emptyMessage="No advertising recommendations yet. Recommendations appear as products go live."
        />
      </ExecutivePanel>

      <ExecutivePanel
        title="Pending Grand King Approval (GC-02)"
        eyebrow="No ungated money move — every spend change waits for a verdict"
        variant={pendingItems.length > 0 ? "accent" : "muted"}
      >
        <ApprovalPanel
          title="Spend Changes Awaiting Approval"
          items={pendingItems}
          emptyMessage="No spend changes proposed. Use “Propose spend” on a platform to stage a governed change."
          onApprove={(id) => setVerdicts((prev) => ({ ...prev, [id]: "approved" }))}
          onReject={(id) => setVerdicts((prev) => ({ ...prev, [id]: "rejected" }))}
          onInvestigate={() => navigate(paths.dashboard.approvals)}
        />
        {decided.length > 0 && (
          <ul className="empireList" style={{ marginTop: "var(--space-4)" }}>
            {decided.map((row) => (
              <li
                key={row.id}
                className="empireListItem"
                style={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <span>
                  <strong>{row.platform}</strong> · {usd(row.budgetUsd)} budget change
                </span>
                <StatusBadge
                  status={verdicts[row.id] === "approved" ? "APPROVED" : "REJECTED"}
                  label={verdicts[row.id] === "approved" ? "Approved · execution gated" : "Rejected"}
                />
              </li>
            ))}
          </ul>
        )}
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
