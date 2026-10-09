import type {Actor,Candidate,Command,Listing,CanonicalOrder} from './contracts.js';
import {digest} from './store.js';
export function acceptanceScenario(workspace:string,ownerId:string,now:number){
 const at=new Date(now).toISOString(),expiresAt=new Date(now+3600000).toISOString();
 const provenance={source:'work6-deterministic-acceptance',reference:'synthetic:work6-fixture-not-provider-evidence',sha256:digest('synthetic-work6-v1'),observedAt:at,expiresAt,classification:'SYNTHETIC' as const};
 const evidence=(['DEMAND','COMPETITION','DIFFERENTIATION','QUALITY','COMPLIANCE','RETURNS','MARKETPLACE','PAYMENT'] as const).map(kind=>({id:'evidence-'+kind,kind,value:100,verified:true,provenance}));
 const candidate:Candidate={productId:'cj-product-fixture',title:'Synthetic storage organiser',category:'HOME_STORAGE',restricted:false,offer:{provider:'CJ',productId:'cj-product-fixture',variantId:'cj-variant-fixture',sku:'cj-sku-fixture',warehouseId:'warehouse-fixture',origin:'CN',destination:'SG',stock:10,price:8,freight:3,currency:'SGD',leadDays:8,quoteId:'quote-fixture',provenance},evidence,economics:{productId:'cj-product-fixture',supplierId:'CJ',channel:'AMAZON',country:'SG',currency:'SGD',sellingPrice:40,productCost:8,freight:3,fulfilment:1,feePercent:15,paymentPercent:2,advertising:1,refundRate:0.05,refundLoss:12,duties:1,tax:1,overhead:1,complete:true,evidenceRefs:evidence.map(x=>x.id),assumptions:'Entirely synthetic isolated acceptance; not actual sales or supplier quotes.'},cash:{available:1000,liabilities:20,committed:0,budget:500,fxVerified:true,financialDigest:digest('synthetic-financial-snapshot')}};
 const listing:Listing={productId:candidate.productId,title:candidate.title,bullets:['Synthetic dimensions for acceptance only'],description:'Synthetic listing package, not intended for marketplace publication.',category:candidate.category,attributes:{material:'fixture'},variants:[{sku:candidate.offer.sku,variantId:candidate.offer.variantId,dimensions:'10x10x10 cm fixture'}],images:[{url:'https://example.invalid/fixture.png',license:'Synthetic acceptance image manifest; no actual media licensed',rightsEvidence:'evidence-QUALITY',sha256:digest('fixture-image')}],claims:[{text:'Synthetic fixture',evidenceId:'evidence-QUALITY'}],sourceEvidence:evidence.map(x=>x.id)};
 const intentDigest=digest({candidate,listing});
 const order:CanonicalOrder={orderId:'order-fixture',workspaceId:workspace,storeId:'isolated',brandId:'fixture',supplierPlatform:'CJ_DROPSHIPPING',connectorId:'cj-interceptor',status:'DRAFT',fulfillmentStatus:'PENDING',items:[{itemId:'line-1',supplierSku:candidate.offer.sku,supplierProductId:candidate.productId,title:candidate.title,quantity:2,unitCost:8,currency:'SGD'}],shippingAddress:{fullName:'Synthetic Recipient',addressLine1:'Fixture address',city:'Singapore',state:'Singapore',postalCode:'000000',countryCode:'SG',phone:'00000000'},estimatedCost:16,estimatedDeliveryDaysMin:7,estimatedDeliveryDaysMax:10,currency:'SGD',approval:null,supplierOrderId:null,trackingNumber:null,carrier:null,trackingEvents:[],integrationMode:'SANDBOX',createdAt:at,updatedAt:at};
 const actors:Record<string,Actor>={PROPOSER:{id:'pillow-commerce-proposer',workspace,role:'PROPOSER'},REVIEWER:{id:'commerce-independent-policy-reviewer',workspace,role:'REVIEWER'},OWNER:{id:ownerId,workspace,role:'OWNER'},EXECUTOR:{id:'brain-commerce-interceptor',workspace,role:'EXECUTOR'}};
 const steps:Array<{actor:Actor;command:Command}>=[];const add=(role:string,command:Command)=>steps.push({actor:actors[role]!,command});
 add('PROPOSER',{type:'research',candidate});add('PROPOSER',{type:'listing',listing});
 add('REVIEWER',{type:'review',digest:intentDigest,decision:'APPROVE',reason:'Deterministic independent policy review of synthetic fixture; no live authority.'});
 add('OWNER',{type:'approve',digest:intentDigest,expiresAt,maxExposure:100});
 add('EXECUTOR',{type:'intake',order,paymentEvidence:'evidence-PAYMENT'});add('EXECUTOR',{type:'prepare',orderId:order.orderId,offer:candidate.offer});
 add('EXECUTOR',{type:'intercept',orderId:order.orderId,result:'ACCEPTED',acceptedQuantity:2,providerId:'cj-intercepted-receipt'});
 const track={orderId:order.orderId,shipmentId:'shipment-fixture',providerId:'cj-intercepted-receipt',carrier:'fixture-carrier',tracking:'fixture-tracking',quantity:2,occurredAt:at};
 add('EXECUTOR',{type:'tracking',event:{...track,eventId:'tracking-shipped',status:'SHIPPED'}});
 add('EXECUTOR',{type:'tracking',event:{...track,eventId:'tracking-delivered',status:'DELIVERED',proof:'synthetic-delivery-proof'}});
 add('EXECUTOR',{type:'remedy',orderId:order.orderId,caseId:'return-fixture',kind:'RETURN',amount:0,quantity:1,reason:'Synthetic damaged item'});
 add('EXECUTOR',{type:'remedy',orderId:order.orderId,caseId:'refund-fixture',kind:'REFUND',amount:20,quantity:1,reason:'Isolated partial remedy exposure; no payment'});
 for(const days of [30,60,90] as const)add('REVIEWER',{type:'outcome',outcome:{id:'outcome-'+days,verified:true,days,sales:0,conversion:0.001,margin:-1,stockouts:1,deliveryFailures:1,returns:1,restricted:days===90,cash:10,provenance}});
 add('PROPOSER',{type:'reassess'});
 for(const days of [30,60,90])add('OWNER',{type:'reverse_outcome',target:'outcome-'+days,reason:'Synthetic reversal acceptance: original history retained'});
 add('PROPOSER',{type:'reassess'});
 return {candidate,listing,order,actors,steps};
}
