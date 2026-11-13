/* A09 sole public listener. Native authorization remains in the backend.
 * This layer caps raw HTTP bytes (headers included), not provider billing.
 */
import http from 'node:http';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validPortfolioQuery } from './portfolio-query.mjs';

export const LIMITS = Object.freeze({
  responseBytes: 64 * 1024 * 1024,
  exportReserveBytes: 16 * 1024 * 1024,
  requests: 1024,
  connections: 1024,
  concurrentConnections: 16,
  concurrentRequests: 8,
  requestBodyBytes: 16 * 1024,
  requestHeaderBytes: 16 * 1024,
  upstreamResponseBytes: 4 * 1024 * 1024,
  requestTimeoutMs: 10_000,
  socketTimeoutMs: 10_000,
});

const controllerPaths = new Map([
  ['/__owner-review/export', 'GET'],
  ['/__owner-review/export-ack', 'POST'],
]);
const transportPaths = new Map([
  ['/__review_transport/key', 'GET'],
  ['/__review_transport/restore', 'POST'],
]);
export const NATIVE_ROUTES = Object.freeze([
  { path: '/login', method: 'GET', port: 43117 },
  { path: '/cockpit/products', method: 'GET', port: 43117 },
  { path: '/api/auth/me', method: 'GET', port: 43117 },
  { path: '/api/auth/login', method: 'POST', port: 43117 },
  { path: '/api/auth/logout', method: 'POST', port: 43117 },
  { path: '/api/owner/commerce/portfolio', method: 'GET', port: 43117 },
  { path: '/api/owner/commerce/review-session', method: 'GET', port: 43117 },
  { path: '/api/owner/commerce/review', method: 'POST', port: 43117 },
].map(Object.freeze));
const copiedHeaders = ['accept', 'accept-encoding', 'content-type', 'content-length',
  'cookie', 'origin', 'sec-fetch-site', 'x-empire-review-nonce',
  'x-empire-review-controller-token', 'rsc', 'next-router-state-tree',
  'next-router-prefetch', 'next-router-segment-prefetch', 'next-url'];

function invariant(value, code) { if (!value) throw new Error(code); }

export function validateConfig(config) {
  const origin = new URL(config.origin);
  invariant(origin.protocol === 'https:' && origin.origin === config.origin
    && !origin.username && !origin.password, 'EXACT_HTTPS_ORIGIN_REQUIRED');
  invariant(Number.isSafeInteger(config.expiresAtMs), 'ABSOLUTE_EXPIRY_REQUIRED');
  invariant(Array.isArray(config.ingressRoutes) && config.ingressRoutes.length <= 32,
    'EXPLICIT_NATIVE_ROUTES_REQUIRED');
  invariant(Array.isArray(config.staticAssetPaths) && config.staticAssetPaths.length <= 4096,
    'BUILD_MANIFEST_STATIC_PATHS_REQUIRED');
  for (const path of config.staticAssetPaths) {
    invariant(typeof path === 'string' && path.length <= 512
      && path.startsWith('/_next/static/')
      && !path.split('/').some(segment => segment === '.' || segment === '..')
      && !/[?#\\\s]/.test(path) && new URL(path, config.origin).pathname === path,
      'INVALID_STATIC_BUILD_PATH');
  }
  for (const route of config.ingressRoutes) {
    invariant(route && /^\/[A-Za-z0-9/_-]*$/.test(route.path)
      && ['GET', 'POST'].includes(route.method)
      && NATIVE_ROUTES.some(allowed => allowed.path === route.path
        && allowed.method === route.method && allowed.port === route.port), 'INVALID_NATIVE_ROUTE');
  }
  return { origin, host: origin.host, config };
}

export function createBoundedIngress(config, onSeal = reason => {
  process.stdout.write(JSON.stringify({ schema: 'A09_HOST_SEAL_REQUEST_V1', reason }) + '\n');
}) {
  const checked = validateConfig(config);
  const counts = { responseBytes: 0, requests: 0, connections: 0,
    concurrentRequests: 0, concurrentConnections: 0, transportRestoreRequests: 0,
    draining: false, reason: null };
  const sockets = new Set();
  let sealTimer;
  function seal(reason) {
    if (counts.draining) return;
    counts.draining = true;
    counts.reason = reason;
    // Only fixed controller export/ack may continue while backend seals.
    onSeal(reason);
    sealTimer = setTimeout(() => {
      server.close();
      for (const socket of sockets) socket.destroy();
    }, 4500);
    sealTimer.unref();
  }
  function debit(socket, amount) {
    const ceiling = counts.draining ? LIMITS.responseBytes :
      LIMITS.responseBytes - LIMITS.exportReserveBytes;
    if (counts.responseBytes + amount > ceiling) {
      socket.destroy(); seal('HTTP_RESPONSE_BYTE_BUDGET'); return false;
    }
    counts.responseBytes += amount;
    return true;
  }
  function installSocketBudget(socket) {
    // Socket internals are where Node serializes HTTP headers, automatic errors,
    // chunk framing, and payloads. Do not separately count res.write/end.
    const write = socket._write.bind(socket), writev = socket._writev?.bind(socket);
    socket._write = (chunk, encoding, callback) => {
      const size = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
      if (debit(socket, size)) write(chunk, encoding, callback);
      else callback(new Error('HTTP_RESPONSE_BYTE_BUDGET'));
    };
    if (writev) socket._writev = (chunks, callback) => {
      const size = chunks.reduce((sum, item) => sum + (Buffer.isBuffer(item.chunk)
        ? item.chunk.length : Buffer.byteLength(item.chunk, item.encoding)), 0);
      if (debit(socket, size)) writev(chunks, callback);
      else callback(new Error('HTTP_RESPONSE_BYTE_BUDGET'));
    };
  }
  function reply(res, status, text) {
    res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store', 'connection': 'close',
      'referrer-policy': 'no-referrer', 'content-security-policy': "frame-ancestors 'none'",
      'x-frame-options': 'DENY', 'x-content-type-options': 'nosniff',
      'content-length': String(Buffer.byteLength(text)) });
    res.end(text);
  }
  const server = http.createServer({ maxHeaderSize: LIMITS.requestHeaderBytes,
    requestTimeout: LIMITS.requestTimeoutMs, headersTimeout: 5000,
    keepAliveTimeout: 1 }, (req, res) => {
    counts.requests++;
    if (counts.requests > LIMITS.requests) { req.socket.destroy(); seal('REQUEST_BUDGET'); return; }
    if (counts.concurrentRequests >= LIMITS.concurrentRequests) {
      req.socket.destroy(); seal('REQUEST_CONCURRENCY'); return;
    }
    counts.concurrentRequests++;
    let finished = false;
    const finish = () => { if (!finished) { finished = true; counts.concurrentRequests--; } };
    res.once('close', finish); res.once('finish', finish);
    req.on('error', () => res.destroy()); res.on('error', () => req.destroy());
    if (req.headers.host !== checked.host || req.url?.includes('\\')
      || !req.url?.startsWith('/') || req.url.startsWith('//')) {
      reply(res, 400, 'Invalid request'); return;
    }
    let url;
    try { url = new URL(req.url, config.origin); }
    catch { reply(res, 400, 'Invalid request'); return; }
    // Canonical exact paths only, no encoded slash/dot bypass to the upstream.
    const isStatic = req.method === 'GET' && !url.search && config.staticAssetPaths.includes(url.pathname);
    if ((!isStatic && url.pathname.includes('%')) || req.url.split('?')[0] !== url.pathname) {
      reply(res, 400, 'Invalid path'); return;
    }
    const isController = controllerPaths.get(url.pathname) === req.method && !url.search;
    const isTransport = transportPaths.get(url.pathname) === req.method && !url.search;
    const isRestore = isTransport && req.method === 'POST';
    if (isRestore && ++counts.transportRestoreRequests > 2) {
      req.socket.destroy(); seal('RESTORE_SUBMISSION_BUDGET'); return;
    }
    if (Date.now() >= config.expiresAtMs) seal('ABSOLUTE_EXPIRY');
    if (counts.draining && !isController) { req.socket.destroy(); return; }
    const sameOrigin = req.headers.origin === config.origin;
    if (req.method === 'POST' && !isController && !isTransport && (!sameOrigin
      || req.headers['sec-fetch-site'] !== 'same-origin')) {
      reply(res, 403, 'Origin rejected'); return;
    }
    let port;
    if (isController) port = 4001;
    else if (isTransport) port = 47900;
    else if (url.pathname === '/__owner-review/health' && req.method === 'GET' && !url.search) {
      reply(res, 200, 'ok'); return;
    } else {
      const route = config.ingressRoutes.find(r => r.path === url.pathname && r.method === req.method);
      const queryAllowed = !url.search || route?.path === '/login' || route?.path === '/cockpit/products'
        || (route?.path === '/api/owner/commerce/portfolio' && req.method === 'GET' && validPortfolioQuery(url.search));
      if (route && queryAllowed) port = route.port;
      // Exact paths generated from the pinned Next build, including route groups.
      // No public filesystem/media directory fallback exists.
      else if (isStatic) port = 43117;
    }
    if (!port) { reply(res, 404, 'Not found'); return; }
    const requestBodyLimit = isRestore ? 2 * 1024 * 1024 : LIMITS.requestBodyBytes;
    if (req.headers['transfer-encoding'] || Number(req.headers['content-length'] ?? 0) > requestBodyLimit) {
      reply(res, 413, 'Request too large'); return;
    }
    const headers = { host: checked.host, 'x-forwarded-host': checked.host,
      'x-forwarded-proto': 'https', connection: 'close' };
    for (const name of copiedHeaders) if (req.headers[name] !== undefined) headers[name] = req.headers[name];
    let bodyBytes = 0, responseBytes = 0;
    const upstream = http.request({ host: '127.0.0.1', port, path: req.url,
      method: req.method, headers, timeout: LIMITS.requestTimeoutMs,
      maxHeaderSize: LIMITS.requestHeaderBytes, agent: false }, incoming => {
      const outputHeaders = { ...incoming.headers, 'cache-control': 'no-store', connection: 'close' };
      outputHeaders['referrer-policy'] = 'no-referrer';
      outputHeaders['x-frame-options'] = 'DENY';
      outputHeaders['x-content-type-options'] = 'nosniff';
      outputHeaders['content-security-policy'] = [incoming.headers['content-security-policy'],
        "frame-ancestors 'none'"].filter(Boolean).join('; ');
      delete outputHeaders['transfer-encoding'];
      // Never allow an upstream response to redirect owner credentials off-origin.
      if (outputHeaders.location) {
        try { if (new URL(outputHeaders.location, config.origin).origin !== config.origin) throw new Error(); }
        catch { incoming.destroy(); reply(res, 502, 'Invalid redirect'); return; }
      }
      res.writeHead(incoming.statusCode ?? 502, outputHeaders);
      incoming.on('data', chunk => {
        responseBytes += chunk.length;
        const responseLimit = isTransport ? 32 * 1024 :
          isController ? 16 * 1024 * 1024 : LIMITS.upstreamResponseBytes;
        if (responseBytes > responseLimit) {
          incoming.destroy(); res.destroy(); seal('UPSTREAM_RESPONSE_LIMIT'); return;
        }
        if (!res.write(chunk)) incoming.pause();
      });
      res.on('drain', () => incoming.resume());
      incoming.on('end', () => res.end());
      incoming.on('error', () => res.destroy());
    });
    upstream.on('timeout', () => upstream.destroy(new Error('UPSTREAM_TIMEOUT')));
    upstream.on('error', () => {
      if (!res.headersSent && !res.destroyed) reply(res, 502, 'Upstream unavailable');
      else res.destroy();
    });
    req.on('data', chunk => {
      bodyBytes += chunk.length;
      if (bodyBytes > requestBodyLimit) { upstream.destroy(); req.destroy(); seal('REQUEST_BODY_LIMIT'); return; }
      if (!upstream.write(chunk)) req.pause();
    });
    upstream.on('drain', () => req.resume());
    req.on('end', () => upstream.end());
    res.on('close', () => upstream.destroy());
  });
  server.on('connection', socket => {
    counts.connections++; counts.concurrentConnections++; sockets.add(socket);
    installSocketBudget(socket);
    socket.on('error', () => {});
    socket.once('close', () => { counts.concurrentConnections--; sockets.delete(socket); });
    socket.setTimeout(LIMITS.socketTimeoutMs, () => socket.destroy());
    if (counts.connections > LIMITS.connections || counts.concurrentConnections > LIMITS.concurrentConnections) {
      socket.destroy(); seal('CONNECTION_BUDGET');
    }
  });
  // Invalid parser input, upgrades and CONNECT never receive automatic responses.
  server.on('clientError', (_error, socket) => socket.destroy());
  server.on('upgrade', (_request, socket) => socket.destroy());
  server.on('connect', (_request, socket) => socket.destroy());
  server.on('checkContinue', (_request, response) => response.destroy());
  const deadlineTimer = setTimeout(() => seal('ABSOLUTE_EXPIRY'), Math.max(0, config.expiresAtMs - Date.now()));
  deadlineTimer.unref();
  server.on('close', () => { clearTimeout(deadlineTimer); clearTimeout(sealTimer); });
  return { server, counts, seal };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = JSON.parse(fs.readFileSync('/private/host-bootstrap.json', 'utf8'));
  const { server } = createBoundedIngress(config);
  server.listen(8080, '0.0.0.0');
}
