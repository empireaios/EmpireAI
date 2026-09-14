"use client";

import { useCallback, useState } from "react";

type SliceResponse = {
  ok?: boolean;
  BIRTH_STATUS?: string;
  WAVE_1?: string;
  REAL_COMMERCE_AUTHORIZED?: boolean;
  objectiveId?: string;
  cockpit?: Record<string, unknown>;
  ledger?: { totals?: { realisedNetProfit?: number }; synthetic?: boolean };
  authority?: Record<string, unknown>;
  restart?: Record<string, unknown>;
  brief?: Record<string, unknown>;
  error?: string;
};

export function ShadowCeoOperatingPanel() {
  const [data, setData] = useState<SliceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/shadow-ceo/run-vertical-slice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as SliceResponse;
      if (!res.ok) {
        setErr(json.error || `HTTP ${res.status}`);
        setData(null);
      } else {
        setData(json);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const cockpit = data?.cockpit ?? {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="rounded border border-[#d4af37]/40 bg-[#1a1814] px-4 py-2 text-sm text-[#d4af37] disabled:opacity-50"
        >
          {loading ? "Running…" : "Run SYNTHETIC vertical slice"}
        </button>
        <span className="text-xs text-[#8a847a]">
          Birth: {data?.BIRTH_STATUS ?? "NOT_BORN"} · Wave: {data?.WAVE_1 ?? "0/24"} · Real
          commerce: locked
        </span>
      </div>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {data?.ok ? (
        <div className="grid gap-3 text-sm text-[#e8e4dc] md:grid-cols-2">
          <Field label="Objective ID" value={String(data.objectiveId ?? "")} />
          <Field
            label="Operating mode"
            value={String(cockpit.operatingMode ?? "SYNTHETIC")}
          />
          <Field
            label="External action lock"
            value={String(cockpit.externalActionLockStatus ?? "LOCKED")}
          />
          <Field
            label="Realised synthetic profit (USD)"
            value={String(data.ledger?.totals?.realisedNetProfit ?? "—")}
          />
          <Field
            label="Live listing blocked"
            value={String(data.authority?.liveListingBlocked)}
          />
          <Field
            label="Restart / idempotency"
            value={JSON.stringify(data.restart)}
          />
          <Field
            label="Pending approvals"
            value={JSON.stringify(cockpit.pendingApprovals ?? [])}
          />
          <Field
            label="Completed tasks"
            value={String(
              Array.isArray(cockpit.completedTasks)
                ? cockpit.completedTasks.length
                : "—",
            )}
          />
          <div className="md:col-span-2 rounded border border-[#3a342c] bg-[#12100e] p-3">
            <div className="mb-1 text-xs uppercase tracking-wide text-[#8a847a]">
              Executive brief
            </div>
            <pre className="whitespace-pre-wrap text-xs text-[#cfc8bc]">
              {JSON.stringify(data.brief ?? cockpit.executiveBrief, null, 2)}
            </pre>
          </div>
          <div className="md:col-span-2 rounded border border-[#3a342c] bg-[#12100e] p-3">
            <div className="mb-1 text-xs uppercase tracking-wide text-[#8a847a]">
              Source-backed cockpit projection
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs text-[#cfc8bc]">
              {JSON.stringify(cockpit, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#8a847a]">
          Run the slice to inspect objective → assessment → priorities → decisions →
          approvals → tasks → outcomes → lessons → brief. All commerce data is SYNTHETIC.
        </p>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#3a342c] bg-[#12100e] p-3">
      <div className="text-xs uppercase tracking-wide text-[#8a847a]">{label}</div>
      <div className="mt-1 break-all text-[#e8e4dc]">{value}</div>
    </div>
  );
}
