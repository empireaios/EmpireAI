/** Offline transport fixture only. Never permitted against a hosted application. */
import assert from 'node:assert/strict';

export async function installGeometryFixture(context, baseUrl) {
  const base = new URL(baseUrl);
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Geometry fixtures are loopback-only');
  const history = [
    {role:'user',content:'Local layout fixture: show the review steps.',timestamp:'2026-01-02T00:00:00.000Z',requestId:'geometry-user'},
    {role:'assistant',content:'### Historical layout fixture\n\n'+Array.from({length:15},(_,i)=>`${i+1}. Review item ${i+1}: verify the source and distinguish known information from unknowns.`).join('\n')+'\n\nThis is synthetic browser-test content, not production evidence.',timestamp:'2026-01-02T00:00:01.000Z',requestId:'geometry-answer'},
  ];
  await context.addCookies([{name:'empireai_session',value:'offline-geometry-fixture-only',url:base.origin}]);
  const requests = [];
  await context.route('**/*', async route => {
    const request=route.request(), url=new URL(request.url());
    if(url.origin!==base.origin){await route.abort();return;}
    if(!url.pathname.startsWith('/api/')){await route.continue();return;}
    requests.push({method:request.method(),path:url.pathname});
    const json=body=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/auth/me')return json({user:{id:'offline-owner',email:'fixture@example.invalid',name:'Grand King',role:'founder',workspaceId:'offline-layout',platformIdentity:'grand-king'}});
    if(url.pathname==='/api/pillow/session')return json({session:{sessionId:'offline-canonical',workspaceId:'offline-layout'},historicalArchiveAccepted:true});
    if(url.pathname==='/api/pillow/history')return json({sessionId:'offline-canonical',workspaceId:'offline-layout',history,historicalArchive:[]});
    // Unneeded secondary panels are explicitly unavailable, not fake successes.
    return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Unavailable in offline geometry fixture'})});
  });
  return requests;
}
