import { z } from "zod";

/** Register this exact URL in the Canva Connect app for production OAuth. */
export const CANVA_PRODUCTION_CALLBACK_URL =
  "https://empire-ai.co/api/integrations/canva/callback" as const;

const canvaEnvSchema = z.object({
  CANVA_CLIENT_ID: z.string().optional(),
  CANVA_CLIENT_SECRET: z.string().optional(),
  CANVA_REDIRECT_URI: z.string().default("http://localhost:4000/canva/oauth/callback"),
  CANVA_API_BASE_URL: z.string().default("https://api.canva.com/rest/v1"),
  CANVA_AUTH_BASE_URL: z.string().default("https://www.canva.com/api/oauth"),
  CANVA_MOCK: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CANVA_DEFAULT_SCOPES: z
    .string()
    .default(
      "design:meta:read design:content:read design:content:write asset:read asset:write brandtemplate:meta:read profile:read",
    ),
});

export type CanvaEnv = z.infer<typeof canvaEnvSchema> & { CANVA_MOCK: boolean };

export function loadCanvaEnv(env: NodeJS.ProcessEnv = process.env): CanvaEnv {
  const parsed = canvaEnvSchema.parse(env);
  const hasLiveCredentials = Boolean(parsed.CANVA_CLIENT_ID && parsed.CANVA_CLIENT_SECRET);

  let mockMode: boolean;
  if (env.CANVA_MOCK === "false") {
    mockMode = false;
  } else if (env.CANVA_MOCK === "true") {
    mockMode = true;
  } else {
    mockMode = !hasLiveCredentials;
  }

  return { ...parsed, CANVA_MOCK: mockMode };
}

export function isCanvaLiveConfigured(config: CanvaEnv): boolean {
  return Boolean(!config.CANVA_MOCK && config.CANVA_CLIENT_ID && config.CANVA_CLIENT_SECRET);
}

export function parseCanvaScopes(config: CanvaEnv): string[] {
  return config.CANVA_DEFAULT_SCOPES.split(/\s+/).filter(Boolean);
}
