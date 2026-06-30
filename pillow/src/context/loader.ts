import type { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ContextArtifactSlice, ContextSourceDescriptor } from "./types.js";

export async function loadContextSlices(
  reader: RepositoryReader,
  sources: ContextSourceDescriptor[],
): Promise<ContextArtifactSlice[]> {
  const slices: ContextArtifactSlice[] = [];
  const loadedPaths = new Set<string>();

  for (const source of sources) {
    if (loadedPaths.has(source.path)) continue;
    loadedPaths.add(source.path);

    const slice = await loadSingleSlice(reader, source);
    if (slice) slices.push(slice);
  }

  return slices;
}

async function loadSingleSlice(
  reader: RepositoryReader,
  source: ContextSourceDescriptor,
): Promise<ContextArtifactSlice | null> {
  const exists = await reader.exists(source.path);
  if (!exists) return null;

  const full = await reader.readText(source.path);
  if (full === null) return null;

  const encoder = new TextEncoder();
  const fullBytes = encoder.encode(full);
  const truncated = fullBytes.length > source.maxBytes;
  const content = truncated
    ? new TextDecoder().decode(fullBytes.subarray(0, source.maxBytes)) +
      "\n\n[… truncated for context minimization …]"
    : full;

  return {
    id: source.id,
    path: source.path,
    content,
    byteLength: encoder.encode(content).length,
    truncated,
  };
}

export function totalSliceBytes(slices: ContextArtifactSlice[]): number {
  return slices.reduce((sum, s) => sum + s.byteLength, 0);
}
