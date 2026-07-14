"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type ScreenAnnotationPayload = {
  screenAnnotation?: {
    computedAt: string;
    engine: {
      status: string;
      performance: { totalAnnotations: number; totalIntentsGenerated: number };
      health: { status: string; healthScore: number };
    };
    readiness: {
      missionId: string;
      healthScore: number;
      engineStatus: string;
      lastDecision: string | null;
    };
    cockpit: {
      engineStatus: string;
      healthStatus: string;
      lastDecision: string | null;
      activeSessions: number;
      totalAnnotations: number;
      intentsGenerated: number;
      clarificationsPending: number;
      confidenceScore: number;
      uxFindingsLinked: number;
      recentLogs: string[];
    };
    latestReport: {
      annotationRunReportId: string;
      latestAnnotation: {
        annotationId: string;
        annotationType: string;
        pointerCoordinates: { x: number; y: number } | null;
        screenRegionBounds: { x: number; y: number; width: number; height: number } | null;
        referencedComponentIds: string[];
        referencedLayoutRegionIds: string[];
        referencedNavigationNodeIds: string[];
        userInstructionSummary: string;
        annotationText: string | null;
        processingStatus: string;
        confidenceScore: number;
        currentScreenId: string | null;
      } | null;
      latestIntent: {
        pointAndEditIntentId: string;
        requestedEditSummary: string;
        linkedBuilderCapabilities: string[];
        clarificationRequirement: string | null;
      } | null;
      validation: { decision: string; warnings: string[] };
    } | null;
  };
  live?: boolean;
};

/** T4-03 — Screen Annotation development panel. */
export function DevelopmentScreenAnnotationPanel() {
  const [data, setData] = useState<ScreenAnnotationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annotationType, setAnnotationType] = useState("point");
  const [pointerX, setPointerX] = useState("320");
  const [pointerY, setPointerY] = useState("180");
  const [annotationText, setAnnotationText] = useState("Improve spacing in this area");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow/screen-annotation", { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ScreenAnnotationPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Screen Annotation");
    } finally {
      setLoading(false);
    }
  }, []);

  const runAnnotate = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/pillow/screen-annotation/annotate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          annotationType,
          pointerCoordinates: {
            x: Number.parseFloat(pointerX),
            y: Number.parseFloat(pointerY),
          },
          annotationText,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as {
        report?: { session?: { sessionId?: string } };
      };
      if (body.report?.session?.sessionId) {
        setSessionId(body.report.session.sessionId);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to annotate screen");
    } finally {
      setRunning(false);
    }
  }, [annotationText, annotationType, load, pointerX, pointerY, sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = data?.screenAnnotation;
  const annotation = snapshot?.latestReport?.latestAnnotation;
  const intent = snapshot?.latestReport?.latestIntent;

  return (
    <div className="space-y-4">
      <Panel
        title="Screen Annotation (T4-03)"
        description="Point-and-edit visual collaboration — annotate visible UI areas and generate structured intents. No automatic apply or approve."
        actions={
          <div className="flex items-center gap-2">
            <DataModeBadge live={data?.live !== false && !!snapshot} />
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1 text-sm"
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
              onClick={() => void runAnnotate()}
              disabled={running}
            >
              {running ? "Annotating…" : "Annotate"}
            </button>
          </div>
        }
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <label className="text-sm">
            Type
            <select
              className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
              value={annotationType}
              onChange={(e) => setAnnotationType(e.target.value)}
            >
              <option value="point">Point</option>
              <option value="highlight">Highlight</option>
              <option value="rectangle">Rectangle</option>
              <option value="component_selection">Component selection</option>
              <option value="layout_region_selection">Layout region</option>
              <option value="navigation_area_selection">Navigation area</option>
              <option value="edit_instruction">Edit instruction</option>
              <option value="ux_complaint_note">UX complaint note</option>
              <option value="design_preference_note">Design preference note</option>
            </select>
          </label>
          <label className="text-sm">
            Pointer X
            <input
              className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
              value={pointerX}
              onChange={(e) => setPointerX(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Pointer Y
            <input
              className="mt-1 w-full rounded-md border border-border bg-background p-2 text-sm"
              value={pointerY}
              onChange={(e) => setPointerY(e.target.value)}
            />
          </label>
        </div>
        <textarea
          className="mt-2 w-full rounded-md border border-border bg-background p-2 text-sm"
          rows={2}
          value={annotationText}
          onChange={(e) => setAnnotationText(e.target.value)}
          placeholder="Annotation note or edit instruction…"
        />
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Loading Screen Annotation…</p>
        ) : snapshot ? (
          <div className="mt-3 space-y-3">
            <DataTable
              columns={["Metric", "Value"]}
              rows={[
                ["Mission", snapshot.readiness.missionId],
                ["Engine", snapshot.engine.status],
                ["Health", `${snapshot.engine.health.status} (${snapshot.engine.health.healthScore})`],
                ["Annotations", String(snapshot.cockpit.totalAnnotations)],
                ["Intents", String(snapshot.cockpit.intentsGenerated)],
                ["UX findings linked", String(snapshot.cockpit.uxFindingsLinked)],
                ["Last decision", snapshot.cockpit.lastDecision ?? "—"],
                ["Confidence", `${snapshot.cockpit.confidenceScore}%`],
              ]}
            />
            {annotation ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Type:</span> {annotation.annotationType}
                </p>
                <p>
                  <span className="text-muted-foreground">Summary:</span> {annotation.userInstructionSummary}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span> {annotation.processingStatus}
                </p>
                {annotation.referencedComponentIds.length > 0 ? (
                  <p>
                    <span className="text-muted-foreground">Components:</span>{" "}
                    {annotation.referencedComponentIds.join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}
            {intent ? (
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Edit intent:</span> {intent.requestedEditSummary}
                </p>
                {intent.clarificationRequirement ? (
                  <p className="text-amber-600">{intent.clarificationRequirement}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
