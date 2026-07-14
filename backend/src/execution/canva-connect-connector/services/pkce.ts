import { createHash, randomBytes } from "node:crypto";

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

export function generateCodeChallenge(codeVerifier: string): string {
  const digest = createHash("sha256").update(codeVerifier).digest();
  return base64UrlEncode(digest);
}

export function generateOAuthState(workspaceId: string, companyId: string): string {
  const nonce = randomBytes(12).toString("hex");
  return `${workspaceId}:${companyId}:${nonce}`;
}

export function parseOAuthState(state: string): { workspaceId: string; companyId: string } | null {
  const parts = state.split(":");
  if (parts.length < 3) return null;
  return { workspaceId: parts[0]!, companyId: parts[1]! };
}
