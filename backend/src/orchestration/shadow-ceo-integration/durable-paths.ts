/**
 * Single durable storage root for Shadow CEO chat + cockpit parity.
 */

import fs from "node:fs";
import path from "node:path";

export function resolveShadowCeoDataRoot(): string {
  const dataRoot =
    process.env.SHADOW_CEO_DATA_DIR ||
    process.env.EMPIRE_DATA_DIR ||
    path.resolve(process.cwd(), ".data");
  fs.mkdirSync(dataRoot, { recursive: true });
  return dataRoot;
}

export function resolveShadowCeoDbPath(): string {
  return path.join(resolveShadowCeoDataRoot(), "shadow-ceo.db");
}

export function resolveShadowCeoAuthorityDir(): string {
  return path.join(resolveShadowCeoDataRoot(), "shadow-ceo-authority");
}
