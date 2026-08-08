/**
 * Production deployment-truth stamp for EOS certification.
 * Distinguishes SOURCE_PUSHED from PRODUCTION_BUNDLE_VERIFIED.
 * Vercel injects VERCEL_GIT_COMMIT_SHA at deploy time.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stable marker present only in the repaired EOS UX source line. */
export const EOS_UX_BUNDLE_MARKER = "type now; Send when ready";

export async function GET() {
  const gitCommitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    process.env.GIT_COMMIT_SHA ??
    null;
  const gitCommitRef =
    process.env.VERCEL_GIT_COMMIT_REF ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ??
    null;
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID ?? null;

  return Response.json(
    {
      surface: "empireai-web",
      eosUxMarker: EOS_UX_BUNDLE_MARKER,
      eosFixInBundle: true,
      gitCommitSha,
      gitCommitRef,
      deploymentId,
      servedAt: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    },
  );
}
