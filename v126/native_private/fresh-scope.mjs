// Additional operator-scope restriction; the native policy/auth checks still run.
export function allowedFreshRequest(method,url,body){
 const p=String(url).split('?')[0];
 if(!p||p.includes('%')||p.includes('\\')||p.includes('//'))return false;
 if(method==='GET'&&['/auth/me','/api/owner/commerce/portfolio','/api/owner/commerce/twin'].includes(p))return true;
 if(method==='POST'&&['/auth/login','/auth/logout','/auth/refresh'].includes(p))return true;
 if(method!=='POST'||p!=='/api/owner/commerce'||!body||Array.isArray(body)||typeof body!=='object')return false;
 const t=body.transition;
 return Object.keys(body).sort().join(',')==='action,transition'&&body.action==='twin_lifecycle'&&
  !!t&&typeof t==='object'&&!Array.isArray(t)&&Object.keys(t).sort().join(',')==='action,expectedVersion,id,sessionId'&&
  t.action==='CREATE'&&t.expectedVersion===0&&typeof t.id==='string'&&/^[A-Za-z0-9_.:-]{1,100}$/.test(t.id)&&
  typeof t.sessionId==='string'&&/^[A-Za-z0-9_.:-]{1,100}$/.test(t.sessionId);
}
