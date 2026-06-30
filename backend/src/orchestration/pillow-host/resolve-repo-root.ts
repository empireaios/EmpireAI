import path from "node:path";
import { fileURLToPath } from "node:url";

import { findRepositoryRoot } from "@empireai/pillow";
import { env } from "../../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve monorepo root for Pillow bootstrap — env override or walk from host module. */
export async function resolvePillowRepositoryRoot(
  override?: string,
): Promise<string> {
  const candidates = [
    override,
    env.EMPIREAI_REPO_ROOT,
    process.env.EMPIREAI_REPO_ROOT,
    path.resolve(__dirname, "../../../.."),
    process.cwd(),
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    const found = await findRepositoryRoot(resolved);
    if (found) return found;
  }

  throw new Error(
    "Could not resolve EmpireAI repository root for Pillow. Set EMPIREAI_REPO_ROOT.",
  );
}
