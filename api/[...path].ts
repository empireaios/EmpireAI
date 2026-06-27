import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const { getApp } = await import("../backend/dist/app.js");
  const app = await getApp();

  const incomingUrl = req.url ?? "/";
  req.url = incomingUrl.replace(/^\/api/, "") || "/";

  await new Promise<void>((resolve, reject) => {
    res.on("close", resolve);
    res.on("error", reject);
    app.server.emit("request", req, res);
  });
}
