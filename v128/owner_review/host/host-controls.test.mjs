import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { createBoundedIngress, LIMITS } from './bounded-ingress.mjs';

const config = { origin: 'https://review.example', expiresAtMs: Date.now() + 60_000,
  staticAssetPaths: ['/_next/static/chunks/app/(auth)/login/page-pinned.js'],
  ingressRoutes: [{ path: '/login', method: 'GET', port: 43117 },
    { path: '/api/owner/commerce/portfolio', method: 'GET', port: 43117 },
    { path: '/api/auth/login', method: 'POST', port: 43117 }] };
let seenHeaders;
const upstream = http.createServer((req, res) => {
  seenHeaders = req.headers;
  res.setHeader('x-proof', 'included-in-raw-byte-budget');
  res.end('native-placeholder');
});
await new Promise(resolve => upstream.listen(43117, '127.0.0.1', resolve));
const reasons = [];
const instance = createBoundedIngress(config, reason => reasons.push(reason));
await new Promise(resolve => instance.server.listen(0, '127.0.0.1', resolve));
const port = instance.server.address().port;
function raw(request, targetPort = port) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(targetPort, '127.0.0.1');
    const parts = [];
    socket.setTimeout(2000, () => socket.destroy());
    socket.on('connect', () => socket.write(request));
    socket.on('data', chunk => parts.push(chunk));
    socket.on('close', () => resolve(Buffer.concat(parts)));
    socket.on('error', error => error.code === 'ECONNRESET' ? resolve(Buffer.concat(parts)) : reject(error));
  });
}

// Transport is the sole body-size exception and shares global output budgets.
let restoredBytes = 0;
const transport = http.createServer((req, res) => {
  req.on('data', chunk => { restoredBytes += chunk.length; });
  req.on('end', () => res.end('transport-placeholder'));
});
await new Promise(resolve => transport.listen(47900, '127.0.0.1', resolve));
const transportReasons = [];
const gateway = createBoundedIngress(config, reason => transportReasons.push(reason));
await new Promise(resolve => gateway.server.listen(0, '127.0.0.1', resolve));
const gatewayPort = gateway.server.address().port;
try {
  const normalLarge = await raw('POST /api/auth/login HTTP/1.1\r\nHost: review.example\r\nOrigin: https://review.example\r\nSec-Fetch-Site: same-origin\r\nContent-Length: 20000\r\nConnection: close\r\n\r\n', gatewayPort);
  assert.match(normalLarge.toString(), /413 Payload Too Large/);
  const key = await raw('GET /__review_transport/key HTTP/1.1\r\nHost: review.example\r\nConnection: close\r\n\r\n', gatewayPort);
  assert.match(key.toString(), /200 OK/);
  const oversized = await raw('POST /__review_transport/restore HTTP/1.1\r\nHost: review.example\r\nContent-Length: 2097153\r\nConnection: close\r\n\r\n', gatewayPort);
  assert.match(oversized.toString(), /413 Payload Too Large/);
  const fakePacket = 'x'.repeat(128 * 1024);
  const restored = await raw(`POST /__review_transport/restore HTTP/1.1\r\nHost: review.example\r\nContent-Length: ${fakePacket.length}\r\nConnection: close\r\n\r\n${fakePacket}`, gatewayPort);
  assert.match(restored.toString(), /200 OK/);
  assert.equal(restoredBytes, fakePacket.length);
  const third = await raw('POST /__review_transport/restore HTTP/1.1\r\nHost: review.example\r\nContent-Length: 0\r\nConnection: close\r\n\r\n', gatewayPort);
  assert.equal(third.length, 0);
  assert.deepEqual(transportReasons, ['RESTORE_SUBMISSION_BUDGET']);
  console.log(JSON.stringify({ status: 'PASS', checks: ['nativebody remains16KiB',
    'publickey exactroute', 'restore greaterthan2MiBrefused', 'boundedrestorebody forwarded',
    'thirdrestore submission seals'], providerWrites: 0, ownerActions: 0 }));
} finally {
  gateway.server.closeAllConnections();
  await new Promise(resolve => gateway.server.close(resolve));
  await new Promise(resolve => transport.close(resolve));
}
try {
  let before = instance.counts.responseBytes;
  const success = await raw('GET /login HTTP/1.1\r\nHost: review.example\r\nX-Forwarded-Host: attacker.invalid\r\nX-Forwarded-Proto: http\r\nConnection: close\r\n\r\n');
  assert.match(success.toString(), /200 OK/);
  assert.match(success.toString(), /native-placeholder/);
  assert.equal(instance.counts.responseBytes - before, success.length);
  assert.equal(seenHeaders['x-forwarded-host'], 'review.example');
  assert.equal(seenHeaders['x-forwarded-proto'], 'https');
  assert.match(success.toString(), /referrer-policy: no-referrer/);
  assert.match(success.toString(), /content-security-policy: frame-ancestors 'none'/);
  const staticPath = await raw('GET /_next/static/chunks/app/(auth)/login/page-pinned.js HTTP/1.1\r\nHost: review.example\r\nConnection: close\r\n\r\n');
  assert.match(staticPath.toString(), /200 OK/);
  const unlistedStatic = await raw('GET /_next/static/chunks/app/(auth)/login/page-other.js HTTP/1.1\r\nHost: review.example\r\nConnection: close\r\n\r\n');
  assert.match(unlistedStatic.toString(), /404 Not Found/);
  const portfolioQuery = '?page=1&pageSize=10&search=&category=&classification=REAL_READ_ONLY&verdict=&sort=title&direction=asc';
  const portfolio = await raw(`GET /api/owner/commerce/portfolio${portfolioQuery} HTTP/1.1\r\nHost: review.example\r\nConnection: close\r\n\r\n`);
  assert.match(portfolio.toString(), /200 OK/);
  for (const badQuery of [portfolioQuery + '&unknown=1', portfolioQuery + '&page=1',
    '?page=0', '?page=100001', '?pageSize=500', '?search=%ZZ', '?search=%20', '?classification=LIVE']) {
    const deniedQuery = await raw(`GET /api/owner/commerce/portfolio${badQuery} HTTP/1.1\r\nHost: review.example\r\nConnection: close\r\n\r\n`);
    assert.match(deniedQuery.toString(), /404 Not Found/);
  }
  before = instance.counts.responseBytes;
  const denied = await raw('GET /private/media.jpg HTTP/1.1\r\nHost: review.example\r\nConnection: close\r\n\r\n');
  assert.match(denied.toString(), /404 Not Found/);
  assert.equal(instance.counts.responseBytes - before, denied.length);
  const csrf = await raw('POST /api/auth/login HTTP/1.1\r\nHost: review.example\r\nOrigin: https://attacker.invalid\r\nContent-Length: 0\r\nConnection: close\r\n\r\n');
  assert.match(csrf.toString(), /403 Forbidden/);
  const parser = await raw('INVALID HTTP DATA\r\n\r\n');
  assert.equal(parser.length, 0);
  instance.counts.responseBytes = LIMITS.responseBytes - LIMITS.exportReserveBytes - 1;
  const overBudget = await raw('GET /login HTTP/1.1\r\nHost: review.example\r\nConnection: close\r\n\r\n');
  assert.equal(overBudget.length, 0);
  assert.equal(instance.counts.draining, true);
  assert.deepEqual(reasons, ['HTTP_RESPONSE_BYTE_BUDGET']);
  const closed = await raw('GET /login HTTP/1.1\r\nHost: review.example\r\nConnection: close\r\n\r\n');
  assert.equal(closed.length, 0);
  console.log(JSON.stringify({ status: 'PASS', checks: ['raw header/body byte accounting',
    'unauthorized error byte accounting', 'forwarded authority replacement',
    'private media path refused', 'cross-origin POST refused', 'parser zero-output',
    'global budget seals without overflow', 'drain refuses non-controller traffic'],
    providerWrites: 0, ownerActions: 0 }));
} finally {
  instance.server.closeAllConnections();
  await new Promise(resolve => instance.server.close(resolve));
  await new Promise(resolve => upstream.close(resolve));
}
