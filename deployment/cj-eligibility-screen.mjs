/** Conservative launch policy, separate from provider inventory field names. */
export function screenFulfilment(product){
 if(product?.productType==='SUPPLIER_SHIPPED_PRODUCT')return {eligible:false,code:'SUPPLIER_CONTROLS_FULFILMENT',reason:'Supplier manages and ships this product. Reported CJ inventory does not establish CJ-controlled fulfilment.'};
 if(product?.productType!=='ORDINARY_PRODUCT')return {eligible:false,code:'CJ_CONTROL_NOT_ESTABLISHED',reason:'This launch screen requires ordinary CJ-managed products; other or missing classifications need a separate policy review.'};
 return {eligible:true,code:'STOCK_EVIDENCE_REQUIRED',reason:'CJ-managed product classification only; exact variant, reconciled stock, freight and marketplace economics are still required.'};
}
