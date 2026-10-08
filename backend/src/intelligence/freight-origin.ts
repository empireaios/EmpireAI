import type {Row} from './store.js';

/** CJ inventory inquiry: only an exact variant's explicit warehouse country is
 * an origin operand. This is not proof of available-to-promise stock or dispatch.
 * Contract: https://developers.cjdropshipping.com/en/api/api2/api/product.html
 */
export function freightOrigin(stock:Row|undefined,variant:string):string|null{
 if(!stock||stock.capabilityId!=='cj.stock'||stock.provider!=='CJ'||stock.authenticity!=='LIVE_PROVIDER'||stock.subject?.variant!==variant)return null;
 const rows=stock.facts?.response;
 if(!Array.isArray(rows))return null;
 const countries=new Set<string>();
 for(const row of rows){
  if(!row||row.vid!==variant)continue;
  // Preserve the existing supported origin set; unknown or ambiguous data fails closed.
  if(typeof row.countryCode!=='string'||!['CN','US'].includes(row.countryCode))return null;
  countries.add(row.countryCode);
 }
 return countries.size===1?[...countries][0]!:null;
}
