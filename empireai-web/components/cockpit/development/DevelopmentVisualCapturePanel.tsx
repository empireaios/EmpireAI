"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type VisualCapturePayload = {
  visualCapture?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { successfulFrames: number; failedFrames: number };
      health: { status: string; healthScore: number; notes: string[] };
      configuration: { captureSource: string; captureIntervalMs: number };
      selectedWindow: { title: string } | null;
    };
    cockpit: {
      captureStatus: string;
      healthStatus: string;
      framesCaptured: number;
      viewportDimensions: string;
      selectedWindowTitle: string | null;
      recentLogs: string[];
    };
    latestFrame: {
      metadata: {
        timestamp: string;
        frameNumber: number;
        viewport: { width: number; height: number };
        captureDurationMs: number;
      };
      byteLength: number;
    } | null;
  };
  live?: boolean;
  engine?: VisualCapturePayload["visualCapture"] extends undefined ? never : VisualCapturePayload["visualCapture"]["engine"];
};

/** T1-01 — Visual Capture Engine development panel. */
export function DevelopmentVisualCapturePanel() {
  const [data, setData] = useState<VisualCapturePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/visual-capture", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as VisualCapturePayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Visual Capture");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  const vc = data?.visualCapture;
  const engine = vc?.engine;
  const cockpit = vc?.cockpit;

  if (loading && !data) {
    return <Panel title="Visual Capture Engine">Loading visual capture…</Panel>;
  }

  if (error) {
    return (
      <Panel title="Visual Capture Engine" subtitle="T1-01 · Live Screen Acquisition">
        <p className="text-sm text-amber-200">{error}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel title="Visual Capture Engine" subtitle="T1-01 · Pillow receives live UI">
        <div className="flex flex-wrap items-center gap-2">
          <DataModeBadge mode={data?.live === false ? "sandbox" : "live"} />
          <span className="text-xs text-[#6f6a60]">
            Status: {engine?.status ?? cockpit?.captureStatus ?? "unknown"}
          </span>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-[#6f6a60]">Frames Captured</p>
            <p className="text-[#d4af37]">{engine?.performance.successfulFrames ?? cockpit?.framesCaptured ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Health</p>
            <p>{engine?.health.status ?? cockpit?.healthStatus ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Viewport</p>
            <p>{cockpit?.viewportDimensions ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Window</p>
            <p className="line-clamp-1">{cockpit?.selectedWindowTitle ?? engine?.selectedWindow?.title ?? "—"}</p>
          </div>
        </div>
        {vc?.latestFrame && (
          <p className="mt-3 text-xs text-[#8a847a]">
            Latest frame #{vc.latestFrame.metadata.frameNumber} · {vc.latestFrame.byteLength} bytes ·{" "}
            {vc.latestFrame.metadata.captureDurationMs}ms
          </p>
        )}
      </Panel>

      {cockpit?.recentLogs && cockpit.recentLogs.length > 0 && (
        <Panel title="Capture Logs">
          <DataTable
            columns={[
              { key: "log", header: "Event" },
            ]}
            rows={cockpit.recentLogs.map((log, i) => ({ log, key: String(i) }))}
          />
        </Panel>
      )}
    </div>
  );
}
