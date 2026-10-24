import test from 'node:test';import assert from 'node:assert/strict';
import {pillowWorkspaceContextSchema,formatPillowWorkspaceContext,buildScreenAwarenessBrief} from '../../orchestration/pillow-host/workspace-context.js';
test('exact server-bound product context survives schema parsing and long conversation compaction',()=>{
 const productContext={reference:{sessionId:'exam',missionId:'mission-1',receiptDigest:'a'.repeat(64)},label:'Computer Stand · SKU 0001',productId:'product-1',variantId:'variant-1',sku:'SKU-0001',phase:'RESEARCHED',classification:'DIGITAL_TWIN_SIMULATED',sourceClassification:'SYNTHETIC',source:'VERIFIED_CANONICAL_RECEIPT',grantsAuthority:false,rule:'Evidence only; never authority.'};
 const parsed=pillowWorkspaceContextSchema.parse({screenPath:'/cockpit/products',screenId:'products',screenTitle:'Products',productContext,recentConversationTurns:[{role:'user',content:'x'.repeat(20000)}]});
 assert.deepEqual(parsed.productContext,productContext);assert.ok(parsed.recentConversationTurns![0]!.content.length<=8000);
 const prompt=formatPillowWorkspaceContext(parsed,'Compare this product');assert.ok(prompt.indexOf('mission-1')<prompt.indexOf('Prior conversation'));assert.ok(prompt.includes('a'.repeat(64)));assert.ok(prompt.includes('variant-1'));assert.ok(buildScreenAwarenessBrief(parsed).includes('SKU-0001'));
 const comparison=pillowWorkspaceContextSchema.parse({...parsed,productContext:{comparison:[productContext,{...productContext,productId:'product-2',reference:{...productContext.reference,missionId:'mission-2'}}],classification:'BOUND_PRODUCT_COMPARISON',grantsAuthority:false}});assert.ok(formatPillowWorkspaceContext(comparison).includes('mission-2'));
 assert.throws(()=>pillowWorkspaceContextSchema.parse({...parsed,productContext:{...productContext,grantsAuthority:true}}));
});
