import {capabilities} from './model.js';
/** Fixed text-output contract, not provider tool execution or arbitrary schema input. */
export function investigationOutputFormat(phase:'plan'|'review'|'assessment'){
 if(!['plan','review','assessment'].includes(phase))throw Error('INVESTIGATION_OUTPUT_PHASE');
 const key={type:'string',minLength:1,maxLength:160,pattern:'^[A-Za-z0-9_.:-]+$'};
 const nullable=(schema:object)=>({anyOf:[schema,{type:'null'}]});
 const object=(properties:Record<string,unknown>)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
 const subject=object({id:key,variant:nullable(key),marketplace:{type:'string',enum:['US','SG','UK','DE','GLOBAL']},destination:nullable({type:'string',pattern:'^[A-Z]{2}$'}),query:nullable({type:'string',minLength:1,maxLength:120,description:'Short provider search terms only; put the research question in objective.'})});
 const job=object({id:key,objective:{type:'string',minLength:4,maxLength:800},capabilities:{type:'array',minItems:1,maxItems:3,items:{type:'string',enum:capabilities.filter(c=>c.implemented&&c.id!=='keepa.history').map(c=>c.id)}},subject,requestLimit:{type:'integer',minimum:1,maximum:3,description:'Includes token refresh requests. Four jobs at most three HTTP requests each keeps the whole batch within twelve.'},evidenceRefs:{type:'array',maxItems:12,items:key}});
 return {type:'json_schema',name:'four_eyes_'+phase,strict:true,schema:object({jobs:{type:'array',minItems:phase==='plan'?1:0,maxItems:phase==='assessment'?0:4,items:job},answer:phase==='plan'?{type:'string',enum:['']}:{type:'string',maxLength:64000,description:'Completed CEO assessment when jobs is empty; otherwise an empty string. Do not include hidden reasoning.'}})};
}
