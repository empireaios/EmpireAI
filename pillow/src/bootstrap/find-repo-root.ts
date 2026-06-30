import path from "node:path";
import { access, constants } from "node:fs/promises";

const REPO_MARKERS = ["JOURNEY.md", "PILLOW_ARCHITECTURE_CONTRACT.md"] as const;

/** Walk upward from startDir until repository markers are found. */
export async function findRepositoryRoot(
  startDir: string = process.cwd(),
): Promise<string | null> {
  let current = path.resolve(startDir);

  for (let depth = 0; depth < 12; depth++) {
    const allPresent = await Promise.all(
      REPO_MARKERS.map((marker) =>
        access(path.join(current, marker), constants.R_OK)
          .then(() => true)
          .catch(() => false),
      ),
    );

    if (allPresent.every(Boolean)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return null;
}
