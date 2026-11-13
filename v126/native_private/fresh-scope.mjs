// Additional connector-examination restriction; original native auth/policy remains unchanged.
export function allowedFreshRequest(method,url,body){
 const p=String(url).split('?')[0];
 if(!p||p.includes('%')||p.includes('\\')||p.includes('//'))return false;
 if(method==='GET'&&['/auth/me','/api/owner/commerce/portfolio'].includes(p))return true;
 return method==='POST'&&['/auth/login','/auth/logout'].includes(p);
}
