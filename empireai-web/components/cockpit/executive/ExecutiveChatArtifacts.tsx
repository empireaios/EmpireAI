"use client";

import type { PillowChatArtifact } from "@/lib/pillow/types";

function ArtifactCard({ artifact }: { artifact: PillowChatArtifact }) {
  const typeLabel = artifact.artifactType.replace(/_/g, " ");

  if (artifact.artifactType === "generated_image") {
    return (
      <div className="mt-2 rounded-lg border border-gold/15 bg-black/30 p-3">
        <p className="text-[10px] uppercase text-[#d4af37]">Generated Image</p>
        <div className="mt-2 flex aspect-video items-center justify-center rounded border border-gold/10 bg-gradient-to-br from-[#1a1510] to-[#0a0a0a]">
          <p className="max-w-xs px-4 text-center text-xs text-[#8a847a]">{artifact.content}</p>
        </div>
      </div>
    );
  }

  if (artifact.artifactType === "search_report") {
    return (
      <details className="mt-2 rounded-lg border border-gold/15 bg-black/30 p-3">
        <summary className="cursor-pointer text-[10px] uppercase text-[#d4af37]">
          Web Search Report · {artifact.title}
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-xs text-[#c8c0b0]">{artifact.content}</p>
      </details>
    );
  }

  if (artifact.artifactType === "file_analysis") {
    return (
      <div className="mt-2 rounded-lg border border-gold/15 bg-black/30 p-3">
        <p className="text-[10px] uppercase text-[#d4af37]">File Analysis</p>
        <p className="mt-1 whitespace-pre-wrap text-xs text-[#c8c0b0]">{artifact.content}</p>
      </div>
    );
  }

  if (artifact.artifactType === "vision_report") {
    return (
      <div className="mt-2 rounded-lg border border-gold/15 bg-black/30 p-3">
        <p className="text-[10px] uppercase text-[#d4af37]">Vision Analysis</p>
        <p className="mt-1 whitespace-pre-wrap text-xs text-[#c8c0b0]">{artifact.content}</p>
      </div>
    );
  }

  if (artifact.artifactType === "code_output") {
    return (
      <div className="mt-2 rounded-lg border border-gold/15 bg-black/30 p-3">
        <p className="text-[10px] uppercase text-[#d4af37]">Code Output</p>
        <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-emerald-200/90">
          {artifact.content}
        </pre>
      </div>
    );
  }

  if (artifact.artifactType === "generated_document") {
    return (
      <div className="mt-2 rounded-lg border border-gold/15 bg-black/30 p-3">
        <p className="text-[10px] uppercase text-[#d4af37]">Document · {artifact.title}</p>
        <p className="mt-1 line-clamp-4 text-xs text-[#c8c0b0]">{artifact.content}</p>
        <button
          type="button"
          className="mt-2 text-[10px] text-[#d4af37] hover:underline"
          onClick={() => {
            const blob = new Blob([artifact.content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${artifact.artifactId}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded border border-gold/10 px-2 py-1 text-[10px] text-[#6f6a60]">
      {typeLabel} · {artifact.artifactId}
    </div>
  );
}

export function ExecutiveChatArtifacts({ artifacts }: { artifacts: PillowChatArtifact[] }) {
  if (artifacts.length === 0) return null;
  return (
    <div className="space-y-1">
      {artifacts.map((artifact) => (
        <ArtifactCard key={artifact.artifactId} artifact={artifact} />
      ))}
    </div>
  );
}
