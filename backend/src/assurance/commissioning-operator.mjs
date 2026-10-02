import {createHash,timingSafeEqual} from 'node:crypto';
const paths=new Set(['/api/commissioning/read-only/assurance','/api/commissioning/read-only/accounting']);
/** Separate, expiring capability. It never creates a founder session or identity. */
export function authorizeCommissioningRead(request,config,now=Date.now()) {
 if(config.profile!=='LOCKED_COMMISSIONING_V1'||request.method!=='GET'||!paths.has(request.url))return false;
 const expires=Number(config.expiresAt),digest=config.tokenSha256,token=request.token;
 if(!Number.isSafeInteger(now)||!Number.isSafeInteger(expires)||expires<=now||expires-now>7*86400000)return false;
 if(typeof digest!=='string'||!/^[a-f0-9]{64}$/.test(digest)||typeof token!=='string'||!/^[A-Za-z0-9_-]{43,128}$/.test(token))return false;
 return timingSafeEqual(createHash('sha256').update(token).digest(),Buffer.from(digest,'hex'));
}
