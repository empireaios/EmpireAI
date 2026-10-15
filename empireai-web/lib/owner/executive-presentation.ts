/** Display-only formatting; never used in accounting calculations or write payloads. */
export function ownerDate(value:unknown) {
 if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))return 'Not recorded';
 return new Intl.DateTimeFormat('en-SG',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Singapore'}).format(new Date(value))+' SGT';
}
export function ownerLabel(value:unknown) {
 if(value===null||value===undefined||value==='')return 'Unknown';
 return String(value).replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase());
}
export function displayAmount(value:unknown,currency:unknown) {
 if(typeof value!=='number'||!Number.isFinite(value))return 'Unknown';
 const amount=value.toLocaleString('en-SG',{minimumFractionDigits:2,maximumFractionDigits:2});
 return typeof currency==='string'&&/^[A-Z]{3}$/.test(currency)?currency+' '+amount:amount+' (currency unrecorded)';
}
export function financialException(value:unknown) {
 const original=typeof value==='string'?value:'Financial evidence needs review';
 const tariff=original.match(/^(\w+) reviewed tariff expires (\S+);/);
 return tariff?`${ownerLabel(tariff[1])} pricing review due ${ownerDate(tariff[2])}. Reviewed evidence is required before renewal.`:original;
}
