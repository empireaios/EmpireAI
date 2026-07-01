"use client";

import { useState } from "react";
import { Badge, Panel } from "@/components/platform/ui/PlatformPrimitives";
import {
  formatArtifactMetadata,
  isCodeArtifact,
  resolveArtifactContent,
  type MaterializedFilePreview,
} from "@/lib/brain/store-execution/artifact-preview";
import type { ArtifactRow } from "@/lib/brain/store-execution/types";

type ArtifactPreviewSectionProps = {
  artifacts: ArtifactRow[];
  materializedFiles?: MaterializedFilePreview[];
  loading?: boolean;
  error?: string | null;
};

function ConfidenceBadge({ value }: { value: number }) {
  const variant = value >= 75 ? "success" : value >= 50 ? "gold" : "warning";
  return <Badge variant={variant}>{value}% confidence</Badge>;
}

function ArtifactPreviewEmptyState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-gold/15 bg-white/[0.01] px-6 py-10 text-center">
      <p className="font-display text-lg text-[#f0d78c]">No artifact selected</p>
      <p className="mt-2 max-w-sm text-sm text-[#8a847a]">
        Select a generated file from the list to inspect its path, metadata, and content preview.
      </p>
    </div>
  );
}

function ArtifactPreviewViewer({
  artifact,
  materializedFiles,
}: {
  artifact: ArtifactRow;
  materializedFiles: MaterializedFilePreview[];
}) {
  const { content, truncated } = resolveArtifactContent(artifact, materializedFiles);
  const codeStyle = isCodeArtifact(artifact.fileType);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-[#f0d78c]">{artifact.filePath}</p>
          <p className="mt-1 text-xs text-[#6f6a60]">{artifact.artifactId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="gold">{artifact.fileType}</Badge>
          <ConfidenceBadge value={artifact.confidence} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-[#6f6a60]">Metadata</p>
        <pre className="overflow-x-auto rounded-lg border border-gold/10 bg-[#0a0a0a] p-4 font-mono text-xs leading-relaxed text-[#a8a095]">
          <code>{formatArtifactMetadata(artifact.metadata)}</code>
        </pre>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wider text-[#6f6a60]">Generated content</p>
          {truncated && (
            <span className="text-[10px] uppercase tracking-wider text-amber-400/80">
              Preview snippet · full content unavailable
            </span>
          )}
        </div>
        <pre
          className={`max-h-[420px] overflow-auto rounded-lg border border-gold/10 bg-[#0a0a0a] p-4 font-mono text-xs leading-relaxed text-[#c8c0b0] ${
            codeStyle ? "whitespace-pre" : "whitespace-pre-wrap"
          }`}
        >
          <code>{content || "No generated content available."}</code>
        </pre>
      </div>
    </div>
  );
}

export function ArtifactPreviewSection({
  artifacts,
  materializedFiles = [],
  loading = false,
  error = null,
}: ArtifactPreviewSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeSelectedId =
    selectedId && artifacts.some((artifact) => artifact.artifactId === selectedId)
      ? selectedId
      : null;

  const selectedArtifact =
    artifacts.find((artifact) => artifact.artifactId === activeSelectedId) ?? null;

  if (loading) {
    return (
      <Panel title="Artifact Preview" subtitle="Loading generated artifacts…">
        <div className="rounded-lg border border-gold/10 bg-white/[0.02] px-5 py-8 text-sm text-[#8a847a]">
          Loading artifact list from Brain…
        </div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel title="Artifact Preview" subtitle="Unable to load artifacts">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-5 py-8 text-sm text-red-300">
          {error}
        </div>
      </Panel>
    );
  }

  if (artifacts.length === 0) {
    return (
      <Panel title="Artifact Preview" subtitle="No artifacts generated">
        <div className="rounded-lg border border-dashed border-gold/15 px-5 py-8 text-sm text-[#8a847a]">
          Run the manufacturing pipeline to generate storefront artifacts.
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Artifact Preview" subtitle={`${artifacts.length} generated files`}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-[#6f6a60]">Artifacts</p>
          <ul className="space-y-2">
            {artifacts.map((artifact) => {
              const selected = artifact.artifactId === activeSelectedId;
              return (
                <li key={artifact.artifactId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(artifact.artifactId)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                      selected
                        ? "border-gold/40 bg-gold/10"
                        : "border-gold/10 bg-white/[0.02] hover:border-gold/25 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-[#f0d78c]">
                          {artifact.filePath}
                        </p>
                        <p className="mt-1 text-xs text-[#6f6a60]">{artifact.fileType}</p>
                      </div>
                      <span className="shrink-0 text-xs text-[#8a847a]">
                        {artifact.confidence}%
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 font-mono text-[11px] text-[#8a847a]">
                      {artifact.preview}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-[#6f6a60]">Inspector</p>
          {selectedArtifact ? (
            <ArtifactPreviewViewer
              artifact={selectedArtifact}
              materializedFiles={materializedFiles}
            />
          ) : (
            <ArtifactPreviewEmptyState />
          )}
        </div>
      </div>
    </Panel>
  );
}
