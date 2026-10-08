import {capabilities,investigationToolContract,investigationLimits} from './model.js';
/** Fixed text-output contract, not provider tool execution or arbitrary schema input. */
export function investigationOutputFormat(phase:'plan'|'review'|'assessment'){
 if(!['plan','review','assessment'].includes(phase))throw Error('INVESTIGATION_OUTPUT_PHASE');
 // Strict provider output makes optional strings nullable; existing CEO normalization
 // removes these null values before the server validator sees the job.
 const source=structuredClone(investigationToolContract.job) as any;
 const clean=(value:any):any=>Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>key!=='default').map(([key,v])=>[key,clean(v)])):value;
 const nullable=(schema:object)=>({anyOf:[clean(schema),{type:'null'}]});
 const object=(properties:Record<string,unknown>)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
 const properties=clean(source.properties);
 const subjectProperties=properties.subject.properties;
 for(const field of ['variant','destination','query'])subjectProperties[field]=nullable(subjectProperties[field]);
 const subject=object(subjectProperties);
 // Retain the existing Candidate generation subset: four jobs × three HTTP
 // requests fits its twelve-request round. These are not global server limits.
 const job=object({id:properties.id,objective:properties.objective,capabilities:{...properties.capabilities,maxItems:3,items:{type:'string',enum:capabilities.filter(c=>c.implemented&&c.id!=='keepa.history').map(c=>c.id)}},subject,requestLimit:{...properties.requestLimit,maximum:3},evidenceRefs:properties.evidenceRefs});
 return {type:'json_schema',name:'four_eyes_'+phase,strict:true,schema:object({jobs:{type:'array',minItems:phase==='plan'?1:0,maxItems:phase==='assessment'?0:investigationLimits.jobsPerRound,items:job},answer:phase==='plan'?{type:'string',enum:['']}:{type:'string',maxLength:64000,description:'Completed CEO assessment when jobs is empty; otherwise an empty string. Do not include hidden reasoning.'}})};
}
