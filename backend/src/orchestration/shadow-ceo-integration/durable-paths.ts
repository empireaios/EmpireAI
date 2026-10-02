/**
 * Single durable storage root for Shadow CEO chat + cockpit parity.
 */

import fs from "node:fs";
import path from "node:path";

export function resolveShadowCeoDataRoot(): string {
  const railway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_ID);
  const volume = process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim();
  if (railway && (!volume || !path.isAbsolute(volume))) {
    throw new Error("Shadow CEO durable storage requires an attached Railway volume");
  }
  if (railway && (!fs.existsSync(volume!) || !fs.statSync(volume!).isDirectory())) {
    throw new Error("Shadow CEO Railway volume mount is missing; refusing an ephemeral directory");
  }
  const dataRoot = path.resolve(
    process.env.SHADOW_CEO_DATA_DIR?.trim() ||
    process.env.EMPIRE_DATA_DIR?.trim() ||
    (railway ? path.join(volume!, "shadow-ceo") : path.join(process.cwd(), ".data")),
  );
  if (railway) {
    const relative = path.relative(path.resolve(volume!), dataRoot);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error("Shadow CEO durable storage must remain within the attached Railway volume");
    }
  }
  if (railway) {
    let existingAncestor = dataRoot;
    while (!fs.existsSync(existingAncestor)) existingAncestor = path.dirname(existingAncestor);
    const relative = path.relative(fs.realpathSync(volume!), fs.realpathSync(existingAncestor));
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error("Shadow CEO durable storage resolves outside the attached Railway volume");
    }
  }
  fs.mkdirSync(dataRoot, { recursive: true });
  if (railway) {
    const relative = path.relative(fs.realpathSync(volume!), fs.realpathSync(dataRoot));
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error("Shadow CEO durable storage resolves outside the attached Railway volume");
    }
  }
  return dataRoot;
}

export function resolveShadowCeoDbPath(): string {
  return path.join(resolveShadowCeoDataRoot(), "shadow-ceo.db");
}

export function resolveShadowCeoAuthorityDir(): string {
  return path.join(resolveShadowCeoDataRoot(), "shadow-ceo-authority");
}
