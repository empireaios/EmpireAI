import {digest} from './model.js';
import type {Row} from './store.js';
/** Exact endpoint/field contract, not inferred from the product-price contract. */
export const cjFreightCurrencyContract={currency:'USD',endpoint:'/logistic/freightCalculate',field:'logisticPrice',source:'https://developers.cjdropshipping.com/en/api/api2/api/logistic.html',section:'1.1 Freight Calculation / Return',verifiedAt:'2026-10-11'} as const;
const money=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e9?v:typeof v==='string'&&/^\d+(\.\d{1,6})?$/.test(v)&&Number(v)<=1e9?Number(v):null;
const text=(v:unknown)=>typeof v==='string'&&v.trim()&&v.length<=1500?v:null;
export function freightOptions(source:Row|null){
 if(!source||source.provider!=='CJ'||source.capabilityId!=='cj.freight'||source.endpoint!==cjFreightCurrencyContract.endpoint||!Array.isArray(source.facts?.response)||source.facts.response.length>100)return [];
 return source.facts.response.map((raw:unknown)=>{const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Row:{};
 const contradiction=r.currency!==undefined&&r.currency!==null&&r.currency!=='USD';
 return {evidenceId:source.id,rowDigest:digest(raw),amount:money(r.logisticPrice),currency:contradiction?null:'USD',currencyBasis:contradiction?null:cjFreightCurrencyContract,service:text(r.logisticName),leadTime:text(r.logisticAging),currencyContradiction:contradiction};});
}
export function selectFreight(options:Row[],selection:Row|undefined){
 const matches=selection?options.filter(o=>o.evidenceId===selection.evidenceId&&o.rowDigest===selection.rowDigest):options.length===1?options:[];
 return matches.length===1?matches[0]:null;
}
