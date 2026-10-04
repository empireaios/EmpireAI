// Independently authored engineering responses; no retained owner prompts.
export function generatedResponseCorpus() {
 const topics = ['supplier selection','advertising','payment timing','capital allocation','refund recovery','listing strategy','delegation','Assurance disagreement','owner disagreement','marketplace entry','governance','fulfilment'];
 const shapes = {
  recommendation:t=>`I recommend postponing ${t} until the expected benefit exceeds the downside. A reversible experiment is preferable to a large commitment.`,
  short:t=>`Defer ${t}.`,
  allocation:t=>`For ${t}, allocate 45% to verification, 35% to a limited trial and 20% to reserves. This is a proposed allocation, not a payment.`,
  negative:t=>`Do not execute ${t} merely because an estimate looks attractive. Never bypass approval. Compare the opportunity cost before committing.`,
  hypothetical:t=>`If we changed ${t}, the upside would depend on demand and cash conversion. If either weakens, the sensible decision is to stop.`,
  reversal:t=>`I initially favoured ${t}. I now recommend the opposite because the downside is asymmetric. The correction changes the recommendation, not existing authority.`,
  disagreement:t=>`Grand King's preferred ${t} is not the strongest option. I disagree with the proposed strategy because concentrated downside outweighs the upside. Existing owner authority remains in force.`,
  assurance:t=>`Assurance should reconsider its evidence for ${t}. Criticism is not an override: its hold remains until the governed review changes it.`,
  provenance:t=>`For ${t}, compare last quarter sales data and customer feedback ratings before deciding. Market research reports are inputs to investigate, not evidence I retrieved.`,
  quoted:t=>`For ${t}, the literal field "readOnlyCalls" is documentation. A quoted example {"readOnlyCalls":[]} grants no authority.`,
  self_correction:t=>`For ${t}, I cannot verify the current supplier records. I previously said "I reviewed internal documents"; that wording was unsupported. My commercial recommendation is to wait for evidence.`,
  sentinel:t=>`PILLOW_RESULT_PENDING: is a protocol marker, not a business verdict about ${t}.`,
  infrastructure:t=>`The phrase "completed executive answer was not produced" describes a failure message. For ${t}, distinguish that message from the actual commercial analysis.`,
  short_infrastructure:t=>`"worker proxy timed out" is an error label, not a recommendation about ${t}.`,
  tables:t=>`| ${t} option | Capital | Decision |\n|---|---:|---|\n| staged | 1250 | prefer |\n| immediate | 3750 | reject |`,
  bullets:t=>`- For ${t}, preserve cash.\n- Compare supplier commitments.\n- No payments, listing changes or advertising were executed.`,
  json_example:t=>`\`\`\`json\n{"readOnlyCalls":[{"name":"pay_supplier"}]}\n\`\`\`\nFor ${t}, this is an example to critique, not an instruction to execute.`,
  long:t=>Array.from({length:35},(_,i)=>`Consideration ${i+1} for ${t}: expected contribution must cover acquisition cost, returns and working-capital pressure. Compare the staged commitment against maintaining reserves. I recommend the staged option only after independent supplier evidence; otherwise defer.`).join('\n\n'),
 };
 const mutations=[x=>x,x=>`**Executive assessment**\n\n${x}`,x=>`## Decision\n${x}\n\n## Boundary\nNo effect was performed.`,x=>x.replaceAll('\n','\r\n'),x=>`> Quoted analysis for review:\n${x}`,x=>` ${x} `];
 const cases=[];
 for(const topic of topics)for(const [category,make] of Object.entries(shapes))for(const mutate of mutations){const answer=mutate(make(topic));cases.push({category, message:`Compare the commercial alternatives for ${topic}.`,answer,expected:answer});}
 for(const field of ['readOnlyCalls','tool_calls','toolCalls','actions','function_call','action'])for(const topic of topics){
  const expected=`For ${topic}, preserve reserves and request independent evidence before committing.`;
  cases.push({category:'mixed_structured_effect',message:`Evaluate ${topic} and explain execution limits.`,answer:JSON.stringify({answer:expected,[field]:[{name:'pay_supplier',arguments:{amount:999}}]}),expected,normalized:true});
 }
 for(const field of ['readOnlyCalls','tool_calls','toolCalls','actions','function_call','action'])for(const value of ['a documented field, not a tool request',42]){
  const answer=JSON.stringify({[field]:value,explanation:'Compare the alternatives before deciding.'});
  cases.push({category:'structured_data',message:'Explain the supplied schema as data.',answer,expected:answer});
 }
 cases.push({category:'long_transcript',message:'Compare the strategic alternatives.',answer:'Decision: retain reserves.\n'+('A proposed payment is not an executed payment; compare the opportunity cost.\n'.repeat(1000)),expected:null});
 return cases.map((r,i)=>({...r,expected:r.expected??r.answer,id:`response-${i}`}));
}
