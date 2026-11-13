import {proxyBrainRequest} from '@/lib/brain/server-proxy';

const deny = (status: number, error: string) => Response.json({error}, {
  status, headers: {'cache-control': 'private, no-store', 'referrer-policy': 'no-referrer'},
});
const privateResponse = (response: Response) => {
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'private, no-store');
  headers.set('referrer-policy', 'no-referrer');
  return new Response(response.body, {status: response.status, headers});
};

/** The isolated review deployment supplies one exact HTTPS origin. Forwarded
 * host/protocol headers never establish this boundary. Ordinary deployments
 * have no review entrypoint. Native owner authentication remains upstream. */
export async function proxyOwnerReview(request: Request, command: boolean): Promise<Response> {
  if (process.env.EMPIRE_CONNECTOR_OWNER_REVIEW_MODE !== 'RESTORED_A08_V2') return deny(404, 'Unavailable');
  const configured = process.env.EMPIRE_OWNER_REVIEW_ORIGIN;
  let origin: URL;
  try {
    origin = new URL(configured ?? '');
    if (origin.protocol !== 'https:' || origin.origin !== configured || origin.username || origin.password) return deny(503, 'Review binding unavailable');
  } catch { return deny(503, 'Review binding unavailable'); }
  if (request.headers.get('host') !== origin.host || request.headers.get('sec-fetch-site') !== 'same-origin') return deny(403, 'Same-origin review required');
  const suppliedOrigin = request.headers.get('origin');
  if ((command && suppliedOrigin !== origin.origin) || (suppliedOrigin !== null && suppliedOrigin !== origin.origin) || request.url.includes('?')) return deny(403, 'Same-origin review required');
  const headers: Record<string, string> = {'origin': origin.origin, 'sec-fetch-site': 'same-origin', 'x-empire-owner-review-host': origin.host};
  if (!command) return privateResponse(await proxyBrainRequest('/api/owner/commerce/review-session', request, {method: 'GET', headers, cache: 'no-store', upstreamTimeoutMs: 5000}));
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return deny(415, 'JSON required');
  const nonce = request.headers.get('x-empire-review-nonce');
  if (!nonce || !/^[A-Za-z0-9_-]{32,128}$/.test(nonce)) return deny(403, 'Review session required');
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    const reader = request.body?.getReader();
    if (reader) while (true) {
      const item = await reader.read();
      if (item.done) break;
      bytes += item.value.byteLength;
      if (bytes > 4096) { await reader.cancel(); return deny(413, 'Review request too large'); }
      chunks.push(item.value);
    }
    const body = Buffer.concat(chunks).toString('utf8');
    JSON.parse(body);
    headers['content-type'] = 'application/json';
    headers['x-empire-review-nonce'] = nonce;
    return privateResponse(await proxyBrainRequest('/api/owner/commerce', request, {method: 'POST', headers, body, upstreamTimeoutMs: 5000}));
  } catch { return deny(503, 'Review result unconfirmed; refresh saved history before another action'); }
}
