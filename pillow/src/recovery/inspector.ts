import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RepositoryInspection } from "./types.js";

const execFileAsync = promisify(execFile);

export async function inspectRepositoryState(
  repositoryRoot: string,
): Promise<RepositoryInspection> {
  const inspectedAt = new Date().toISOString();
  try {
    const [diffOut, untrackedOut, statusOut] = await Promise.all([
      execFileAsync("git", ["diff", "--name-only", "HEAD"], {
        cwd: repositoryRoot,
        timeout: 8000,
      }).then((r) => r.stdout),
      execFileAsync("git", ["ls-files", "--others", "--exclude-standard"], {
        cwd: repositoryRoot,
        timeout: 8000,
      }).then((r) => r.stdout),
      execFileAsync("git", ["status", "--porcelain"], {
        cwd: repositoryRoot,
        timeout: 8000,
      }).then((r) => r.stdout),
    ]);

    const modifiedFiles = diffOut.trim().split("\n").filter(Boolean);
    const createdFiles = untrackedOut.trim().split("\n").filter(Boolean);
    const integrityOk = !statusOut.includes("UU") && !statusOut.includes("AA");

    return {
      modifiedFiles,
      createdFiles,
      gitDiffAvailable: true,
      repositoryIntegrityOk: integrityOk,
      diffSummary:
        modifiedFiles.length > 0
          ? `${modifiedFiles.length} modified · ${createdFiles.length} untracked`
          : createdFiles.length > 0
            ? `${createdFiles.length} untracked files`
            : "clean working tree",
      inspectedAt,
    };
  } catch {
    return {
      modifiedFiles: [],
      createdFiles: [],
      gitDiffAvailable: false,
      repositoryIntegrityOk: true,
      diffSummary: "git inspection unavailable",
      inspectedAt,
    };
  }
}
