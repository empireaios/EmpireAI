import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import type { ValidationCycleResult } from "./types.js";

const execFileAsync = promisify(execFile);

/** Doctrine §3 Step 4 — exactly one fresh validation cycle: typecheck then build. */
export async function runValidationCycle(
  repositoryRoot: string,
  options: { dryRun?: boolean; packageDir?: string } = {},
): Promise<ValidationCycleResult> {
  if (options.dryRun) {
    return {
      typecheckPassed: true,
      buildPassed: true,
      executed: false,
      dryRun: true,
      output: "dry-run — validation skipped",
    };
  }

  const pkgDir = path.join(repositoryRoot, options.packageDir ?? "pillow");
  const outputs: string[] = [];
  let typecheckPassed = false;
  let buildPassed = false;

  try {
    const tc = await execFileAsync("npm", ["run", "typecheck"], {
      cwd: pkgDir,
      timeout: 120_000,
    });
    outputs.push(tc.stdout?.slice(0, 500) ?? "");
    typecheckPassed = true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    outputs.push(`typecheck failed: ${message}`);
    return {
      typecheckPassed: false,
      buildPassed: false,
      executed: true,
      dryRun: false,
      output: outputs.join("\n"),
    };
  }

  try {
    const build = await execFileAsync("npm", ["run", "build"], {
      cwd: pkgDir,
      timeout: 120_000,
    });
    outputs.push(build.stdout?.slice(0, 500) ?? "");
    buildPassed = true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    outputs.push(`build failed: ${message}`);
  }

  return {
    typecheckPassed,
    buildPassed,
    executed: true,
    dryRun: false,
    output: outputs.join("\n"),
  };
}
