/** Shared Vercel/Node settings for Brain BFF proxy route handlers. */
export const brainRouteConfig = {
  runtime: "nodejs" as const,
  dynamic: "force-dynamic" as const,
  maxDuration: 60,
};
