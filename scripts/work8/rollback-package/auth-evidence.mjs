// Preserve actual auth response content with credential values removed.
export function cookieAttributes(raw){
 const parts=raw.split(';').map(s=>s.trim());const first=parts.shift()||'';
 return {name:first.split('=',1)[0],present:true,secure:parts.some(x=>/^secure$/i.test(x)),httpOnly:parts.some(x=>/^httponly$/i.test(x)),clears:parts.some(x=>/^max-age=0$/i.test(x))||first.endsWith('='),path:parts.find(x=>/^path=/i.test(x))?.slice(5)||null,sameSite:parts.find(x=>/^samesite=/i.test(x))?.slice(9)||null};
}
export function redactAuth(value,known=[]){
 if(Array.isArray(value))return value.map(v=>redactAuth(v,known));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,/password|token|secret|cookie|authorization|session/i.test(k)?'[REDACTED]':redactAuth(v,known)]));
 if(typeof value==='string'){
  for(const secret of known.filter(Boolean).sort((a,b)=>b.length-a.length))value=value.split(secret).join('[REDACTED]');
  return value.replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,'[REDACTED]').replace(/(bearer\s+)[^\s,;"']+/gi,'$1[REDACTED]');
 }
 return value;
}
