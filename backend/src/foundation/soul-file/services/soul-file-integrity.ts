import { createHash } from "node:crypto";

import type { SoulFileDocument } from "../models/soul-file-document.js";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, sortValue(record[key])]),
    );
  }
  return value;
}

/** Builds canonical JSON for checksum — excludes checksum field itself. */
export function canonicalizeSoulFilePayload(
  document: Omit<SoulFileDocument, "checksum"> | SoulFileDocument,
): string {
  const { checksum: _checksum, ...payload } = document as SoulFileDocument;
  return JSON.stringify(sortValue(payload));
}

/** Computes SHA-256 integrity checksum for a Soul File document. */
export function computeSoulFileChecksum(
  document: Omit<SoulFileDocument, "checksum"> | SoulFileDocument,
): string {
  return createHash("sha256").update(canonicalizeSoulFilePayload(document)).digest("hex");
}

/** Validates Soul File integrity against stored checksum. */
export function validateSoulFileIntegrity(document: SoulFileDocument): {
  valid: boolean;
  expectedChecksum: string;
  actualChecksum: string;
  message: string;
} {
  const actualChecksum = computeSoulFileChecksum(document);
  const valid = actualChecksum === document.checksum;
  return {
    valid,
    expectedChecksum: document.checksum,
    actualChecksum,
    message: valid
      ? "Soul File integrity verified"
      : "Soul File checksum mismatch — document may be corrupted or tampered",
  };
}

export function attachSoulFileChecksum<T extends Omit<SoulFileDocument, "checksum">>(
  document: T,
): SoulFileDocument {
  const checksum = computeSoulFileChecksum(document);
  return { ...document, checksum };
}
