import type { LogInterpretation, LogSource } from "./types.js";

export function interpretLog(source: LogSource, text: string): LogInterpretation {
  switch (source) {
    case "build":
    case "typecheck":
      return interpretBuildLog(source, text);
    case "test":
      return interpretTestLog(text);
    case "railway":
      return interpretRailwayLog(text);
    case "vercel":
      return interpretVercelLog(text);
    case "github":
      return interpretGitHubLog(text);
    case "browser":
      return interpretBrowserLog(text);
    default:
      return interpretBuildLog("build", text);
  }
}

export function interpretAllLogs(logs: Array<{ source: LogSource; text: string }>): LogInterpretation[] {
  return logs.map((l) => interpretLog(l.source, l.text));
}

function interpretBuildLog(source: LogSource, text: string): LogInterpretation {
  const errors = extractMatches(text, /error TS\d+:.+/g, /Error:.+/g, /✖.+/g);
  const warnings = extractMatches(text, /warning.+/gi);
  const success =
    /Successfully compiled|Found 0 errors|✔.*pass|exit code 0|Build completed/i.test(text) &&
    errors.length === 0;

  return {
    source,
    success,
    errors,
    warnings,
    summary: success
      ? `${source} passed — no errors detected`
      : `${source} failed — ${errors.length} error(s)`,
    exitCode: success ? 0 : 1,
  };
}

function interpretTestLog(text: string): LogInterpretation {
  const failMatch = text.match(/(\d+) fail/i);
  const passMatch = text.match(/(\d+) pass/i);
  const failed = failMatch ? parseInt(failMatch[1]!, 10) : 0;
  const passed = passMatch ? parseInt(passMatch[1]!, 10) : 0;
  const errors = extractMatches(text, /✖.+/g, /AssertionError.+/g, /fail \d+/gi);

  return {
    source: "test",
    success: failed === 0 && !/✖|AssertionError|not ok/i.test(text),
    errors,
    warnings: [],
    summary:
      failed === 0
        ? `Tests passed${passed ? ` (${passed})` : ""}`
        : `Tests failed — ${failed} failure(s)`,
    exitCode: failed === 0 ? 0 : 1,
  };
}

function interpretRailwayLog(text: string): LogInterpretation {
  const errors = extractMatches(
    text,
    /deployment failed/gi,
    /health check failed/gi,
    /error:.+/gi,
    /crashed/gi,
  );
  const success =
    /deployment successful|deployed successfully|health check passed|Active/i.test(text) &&
    errors.length === 0;

  return {
    source: "railway",
    success,
    errors,
    warnings: extractMatches(text, /warn.+/gi),
    summary: success ? "Railway deployment healthy" : "Railway deployment issue detected",
    exitCode: success ? 0 : 1,
  };
}

function interpretVercelLog(text: string): LogInterpretation {
  const errors = extractMatches(
    text,
    /Build Failed/gi,
    /Error:.+/g,
    /deployment failed/gi,
    /500|502|503|504/g,
  );
  const success =
    /Ready!|Deployment completed|Build Completed|Production:/i.test(text) && errors.length === 0;

  return {
    source: "vercel",
    success,
    errors,
    warnings: extractMatches(text, /warn.+/gi),
    summary: success ? "Vercel deployment ready" : "Vercel deployment issue detected",
    exitCode: success ? 0 : 1,
  };
}

function interpretGitHubLog(text: string): LogInterpretation {
  const errors = extractMatches(
    text,
    /Process completed with exit code [1-9]/gi,
    /##\[error\].+/g,
    /failure/gi,
    /check suite.*failure/gi,
  );
  const success = /Process completed with exit code 0|success|✓/i.test(text) && errors.length === 0;

  return {
    source: "github",
    success,
    errors,
    warnings: [],
    summary: success ? "GitHub CI passed" : "GitHub CI failure detected",
    exitCode: success ? 0 : 1,
  };
}

function interpretBrowserLog(text: string): LogInterpretation {
  const errors = extractMatches(
    text,
    /Failed to fetch/gi,
    /timeout/gi,
    /404|500|502|503/g,
    /assert.*fail/gi,
    /Error:.+/g,
  );
  const success =
    /200|pass|loaded|session.*ok|health.*200/i.test(text) && errors.length === 0;

  return {
    source: "browser",
    success,
    errors,
    warnings: extractMatches(text, /warn.+/gi),
    summary: success ? "Browser acceptance passed" : "Browser acceptance failed",
    exitCode: success ? 0 : 1,
  };
}

function extractMatches(text: string, ...patterns: RegExp[]): string[] {
  const found: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) found.push(...matches.slice(0, 5));
  }
  return [...new Set(found)].slice(0, 10);
}
