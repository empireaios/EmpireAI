export type TwinChatReference={sessionId?:string;missionId:string;receiptDigest:string};
export const twinContextEvent='empireai-twin-product-context';
const key=(owner:string)=>'empireai-twin-product-v1:'+owner;
export function readTwinChatContext(owner:string):TwinChatReference|null{try{const r=JSON.parse(sessionStorage.getItem(key(owner))??'null');return r&&(r.sessionId===undefined||typeof r.sessionId==='string')&&typeof r.missionId==='string'&&/^[a-f0-9]{64}$/.test(r.receiptDigest)?{...(r.sessionId?{sessionId:r.sessionId}:{}),missionId:r.missionId,receiptDigest:r.receiptDigest}:null;}catch{return null;}}
export function setTwinChatContext(owner:string,reference:TwinChatReference|null){if(reference)sessionStorage.setItem(key(owner),JSON.stringify(reference));else sessionStorage.removeItem(key(owner));window.dispatchEvent(new Event(twinContextEvent));}
