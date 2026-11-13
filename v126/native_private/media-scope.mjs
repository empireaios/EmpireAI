import {allowedFreshRequest} from './fresh-scope.mjs';
// A10 technical preparation only. Personal approval/rejection and all commerce
// mutations remain outside this operation even though the application supports them.
export function allowedMediaPreparationRequest(method,url,body){
 if(allowedFreshRequest(method,url,body))return true;
 if(method!=='POST'||url!=='/api/owner/commerce'||!body||typeof body!=='object'||Array.isArray(body))return false;
 if(Object.keys(body).sort().join(',')!=='action,media'||body.action!=='connector_media')return false;
 const media=body.media;
 return !!media&&typeof media==='object'&&!Array.isArray(media)&&['REQUEST_EDIT','PROPOSE_RETAINED'].includes(media.action);
}
