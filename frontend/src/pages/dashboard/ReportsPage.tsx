import { useMemo, useState } from "react";
import { ArrowRight, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ExecutiveKpiCard, ExecutiveKpiGrid } from "@/components/system/ExecutiveKpiCard";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { ExecutiveTable, type ExecutiveTableColumn } from "@/components/system/ExecutiveTable";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { useEmpireDashboard } from "@/hooks/useEmpireDashboard";
import { brainDispatch } from "@/api/dispatch";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { asArray, asNumber, asRecord, asString, formatCurrencyFromDollars } from "@/lib/empire-data";
import { loadOperatingCost, overallOperatingCost } from "@/lib/operating-cost";
import { paths } from "@/routes/paths";

interface ReportRow {
  id: string;
  report: string;
  summary: string;
  status: string;
  to: string;
}

interface SignOffDomainRow {
  domain: string;
  label: string;
  status: string;
  score: number;
}

type SignOffState = "idle" | "recording" | "recorded" | "failed";

function completionHealth(percent: number): "ok" | "warning" | "critical" {
  if (percent >= 80) return "ok";
  if (percent >= 50) return "warning";
  return "critical";
}

export function ReportsPage() {
  const {
    dashboard,
    ofd,
    success001,
    executiveCouncil,
    grandKingAccount,
    esis,
    masterCompletionLedger,
    version1SignOff,
    loading,
    error,
    reload,
  } = useEmpireDashboard();

  const navigate = useNavigate();
  const [signOffState, setSignOffState] = useState<SignOffState>("idle");

  const mcl = asRecord(masterCompletionLedger);
  const mclSummary = asRecord(mcl?.summary);
  const signOff = asRecord(version1SignOff);

  const completionPercent = Math.round(asNumber(mclSummary?.averageCompletionPercent));
  const signOffReady = signOff?.signOffReady === true;
  const overallScore = Math.round(asNumber(signOff?.overallScore));
  const readyCount = asNumber(signOff?.readyCount);
  const blockedCount = asNumber(signOff?.blockedCount);
  const systemHealth = asString(esis?.overallStatus, asString(esis?.status, "STABLE"));

  const signOffDomains = useMemo<SignOffDomainRow[]>(
    () =>
      asArray(signOff?.signOffItems)
        .map(asRecord)
        .map((item) => ({
          domain: asString(item?.domain, "").replace(/_/g, " "),
          label: asString(item?.label, "Domain"),
          status: asString(item?.status, "PENDING"),
          score: Math.round(asNumber(item?.score)),
        })),
    [signOff],
  );

  const rows = useMemo<ReportRow[]>(() => {
    const revenueToday = asNumber(asRecord(ofd?.revenueToday)?.value);
    const profitToday = asNumber(asRecord(ofd?.profitToday)?.value);
    const s1Progress = asNumber(success001?.progressPercent);
    const marketplaces = asArray(dashboard?.marketplaces).map((m) => asRecord(m));
    const connected = marketplaces.filter((m) => asString(m?.status) === "CONNECTED").length;
    const suppliers = asArray(grandKingAccount?.suppliers).length;
    const opCostOverall = overallOperatingCost(loadOperatingCost());
    const council = asRecord(executiveCouncil?.executiveCouncil);
    const awaiting = asArray(executiveCouncil?.recommendationsAwaitingKing).length;

    return [
      {
        id: "completion",
        report: "Empire Completion",
        summary: `${completionPercent}% average across ${asNumber(mclSummary?.totalPrograms)} programs · ${asNumber(mclSummary?.complete)} complete, ${asNumber(mclSummary?.blocked)} blocked`,
        status: completionPercent >= 80 ? "ACTIVE" : completionPercent >= 50 ? "IN_PROGRESS" : "BLOCKED",
        to: paths.dashboard.command,
      },
      {
        id: "v1-sign-off",
        report: "Version 1 Sign-Off",
        summary: `${signOffReady ? "READY for sign-off" : "Not ready"} · score ${overallScore} · ${readyCount} domains ready, ${blockedCount} blocked`,
        status: signOffReady ? "READY" : blockedCount > 0 ? "BLOCKED" : "PENDING",
        to: paths.dashboard.success001,
      },
      {
        id: "revenue-profit",
        report: "Revenue & Profit",
        summary: `Today: ${formatCurrencyFromDollars(revenueToday)} revenue · ${formatCurrencyFromDollars(profitToday)} profit`,
        status: revenueToday > 0 ? "ACTIVE" : "NOT_STARTED",
        to: paths.dashboard.command,
      },
      {
        id: "success-001",
        report: "SUCCESS-001 Progress",
        summary: `${s1Progress}% toward $100K · ${formatCurrencyFromDollars(asNumber(success001?.currentNetProfitUsd))} net profit`,
        status: s1Progress > 0 ? "IN_PROGRESS" : "BLOCKED",
        to: paths.dashboard.success001,
      },
      {
        id: "marketplace-coverage",
        report: "Marketplace Coverage",
        summary: `${connected} of ${marketplaces.length} marketplaces connected`,
        status: connected > 0 ? "ACTIVE" : "NOT_STARTED",
        to: paths.dashboard.infrastructureMarketplaces,
      },
      {
        id: "supplier-network",
        report: "Supplier Network",
        summary: `${suppliers} connected supplier(s)`,
        status: suppliers > 0 ? "ACTIVE" : "NOT_STARTED",
        to: paths.dashboard.infrastructureSuppliers,
      },
      {
        id: "operating-cost",
        report: "Operating Cost",
        summary:
          opCostOverall > 0
            ? `${formatCurrencyFromDollars(opCostOverall)} / month confirmed`
            : "No actual costs entered yet",
        status: opCostOverall > 0 ? "ACTIVE" : "NOT_STARTED",
        to: paths.dashboard.operatingCost,
      },
      {
        id: "executive-council",
        report: "Executive Council Activity",
        summary: `${asNumber(council?.activeExecutives)} active chiefs · ${awaiting} recommendation(s) awaiting verdict`,
        status: awaiting > 0 ? "ACTION_NEEDED" : "STABLE",
        to: paths.dashboard.debate,
      },
      {
        id: "esis",
        report: "Empire Self-Inspection",
        summary: `System health: ${systemHealth}`,
        status: systemHealth,
        to: paths.dashboard.command,
      },
    ];
  }, [
    dashboard,
    ofd,
    success001,
    executiveCouncil,
    grandKingAccount,
    completionPercent,
    mclSummary,
    signOffReady,
    overallScore,
    readyCount,
    blockedCount,
    systemHealth,
  ]);

  if (loading) return <LoadingState message="Compiling executive reports…" />;
  if (error) {
    return <ErrorState message={error} onRetry={() => void reload()} />;
  }

  const actionNeeded = rows.filter((row) => ["BLOCKED", "ACTION_NEEDED", "NOT_STARTED", "PENDING"].includes(row.status)).length;

  function exportReport() {
    const generatedAt = new Date().toISOString();
    const lines = [
      "# EmpireAI — Executive Report",
      `Generated: ${generatedAt}`,
      "",
      "## Headline verdict",
      `- Empire completion: ${completionPercent}%`,
      `- Version 1 sign-off: ${signOffReady ? "READY" : "NOT READY"} (overall score ${overallScore}; ${readyCount} domains ready, ${blockedCount} blocked)`,
      `- System health (ESIS): ${systemHealth}`,
      "",
      "## Report ledger",
      ...rows.map((r) => `- ${r.report}: ${r.summary} [${r.status}]`),
      "",
      "## Version 1 sign-off domains (REAL-070)",
      ...(signOffDomains.length > 0
        ? signOffDomains.map((d) => `- ${d.label} — ${d.status} (score ${d.score})`)
        : ["- No sign-off domains reported."]),
      "",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `empire-report-${generatedAt.slice(0, 10)}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function recordSignOff() {
    if (!signOffReady || signOffState === "recording" || signOffState === "recorded") return;
    setSignOffState("recording");
    brainDispatch("decision-registry", "record", GRAND_KING_COMPANY_ID, {
      decisionId: "v1-executive-sign-off",
      title: "Version 1 Executive Sign-Off (REAL-070)",
      category: "strategic",
      decision: "SIGN_OFF",
      reason: `Grand King Version 1 sign-off · overall score ${overallScore} · ${readyCount} domains ready`,
      approver: "Grand King",
      actor: "grand-king",
      metadata: { surface: "UX-017", missionId: "REAL-070" },
    })
      .then(() => setSignOffState("recorded"))
      .catch(() => setSignOffState("failed"));
  }

  const signOffLabel =
    signOffState === "recorded"
      ? "Signed off ✓"
      : signOffState === "recording"
        ? "Recording…"
        : signOffState === "failed"
          ? "Retry sign-off"
          : signOffReady
            ? "Record Version 1 sign-off"
            : "Sign-off not ready";

  const columns: ExecutiveTableColumn<ReportRow>[] = [
    { key: "report", header: "Report", render: (row) => <strong>{row.report}</strong>, width: "22%" },
    { key: "summary", header: "Summary", render: (row) => row.summary },
    {
      key: "status",
      header: "Status",
      width: "14%",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "open",
      header: "",
      align: "right",
      width: "6%",
      render: () => <ArrowRight size={16} aria-hidden="true" />,
    },
  ];

  return (
    <EmpirePageShell
      eyebrow="Executive Reporting · UX-017"
      title="Reports"
      description="One scannable ledger of the empire's commercial truth — completion, sign-off verdict, and every report in a single entry. Export anytime; sign off when ready."
      actions={
        <>
          <button type="button" className="empireBtnSecondary" onClick={exportReport}>
            <Download size={15} aria-hidden="true" /> Export report
          </button>
          <button
            type="button"
            className="empireBtnPrimary"
            onClick={recordSignOff}
            disabled={!signOffReady || signOffState === "recording" || signOffState === "recorded"}
            title={signOffReady ? "Record the Grand King's Version 1 sign-off" : "All sign-off domains must be READY first"}
          >
            {signOffLabel}
          </button>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`Empire completion ${completionPercent}% · Version 1 sign-off ${signOffReady ? "READY" : "not ready"} (score ${overallScore}) · system health ${systemHealth}.`}
        why="A single source of commercial truth and a single verdict on completion so decisions are made on evidence, not memory."
        next={
          actionNeeded > 0
            ? `Open the ${actionNeeded} report(s) flagged for action, then export or sign off.`
            : "All reports healthy — export the package or record the Version 1 sign-off."
        }
        decision={
          signOffReady
            ? "Version 1 is ready — record the Grand King's sign-off."
            : `${blockedCount} sign-off domain(s) still blocking Version 1.`
        }
        blocker={
          signOffReady
            ? "Nothing blocking the Version 1 sign-off."
            : `${blockedCount} sign-off domain(s) blocked · ${actionNeeded} report(s) flagged.`
        }
      />

      <ExecutiveKpiGrid>
        <ExecutiveKpiCard
          label="Empire completion"
          value={`${completionPercent}%`}
          source="REAL"
          health={completionHealth(completionPercent)}
          hint="Average across all programs (MCL)"
          accent
        />
        <ExecutiveKpiCard
          label="Version 1 sign-off"
          value={signOffReady ? "READY" : "NOT READY"}
          source="REAL"
          health={signOffReady ? "ok" : blockedCount > 0 ? "critical" : "warning"}
          hint={`Score ${overallScore} · ${readyCount} ready, ${blockedCount} blocked (REAL-070)`}
        />
        <ExecutiveKpiCard
          label="System health"
          value={systemHealth}
          source="REAL"
          health="neutral"
          hint="Empire self-inspection (ESIS)"
        />
      </ExecutiveKpiGrid>

      <ExecutiveTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(row.to)}
        caption="Executive report ledger"
      />

      <ExecutivePanel
        title="Version 1 Sign-Off Domains"
        eyebrow="REAL-070 — executive sign-off verdict by domain"
      >
        <ExecutiveTable
          columns={[
            { key: "label", header: "Domain", render: (row: SignOffDomainRow) => <strong>{row.label}</strong> },
            { key: "domain", header: "Area", render: (row: SignOffDomainRow) => row.domain || "—" },
            { key: "status", header: "Status", render: (row: SignOffDomainRow) => <StatusBadge status={row.status} /> },
            { key: "score", header: "Score", align: "right", render: (row: SignOffDomainRow) => row.score },
          ]}
          rows={signOffDomains}
          getRowKey={(row, index) => row.domain || String(index)}
          emptyMessage="No sign-off domains reported yet."
        />
      </ExecutivePanel>
    </EmpirePageShell>
  );
}
