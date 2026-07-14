/** T1-02 — Deterministic region signature from frame payload. */

import { createHash } from "node:crypto";

export function computeRegionSignature(
  imageBase64: string,
  regionIndex: number,
  totalRegions: number,
): string {
  if (!imageBase64) return "empty";
  const chunkSize = Math.max(1, Math.floor(imageBase64.length / totalRegions));
  const start = (regionIndex * chunkSize) % imageBase64.length;
  const slice = imageBase64.slice(start, start + chunkSize);
  return createHash("sha256").update(`${regionIndex}:${slice}`).digest("hex").slice(0, 16);
}

export function isEmptyOrLoadingFrame(byteLength: number, imageBase64: string): boolean {
  return byteLength < 100 || imageBase64.length < 100;
}
