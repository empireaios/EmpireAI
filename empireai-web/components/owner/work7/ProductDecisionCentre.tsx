'use client';
import {useState} from 'react';
import {Portfolio,Approvals} from './OwnerJourneys';
import s from './business.module.css';
export function ProductDecisionCentre({initialMission='',initialDecisions=false}:{initialMission?:string;initialDecisions?:boolean}) {
 const [decisions,setDecisions]=useState(initialDecisions);
 return <div className={s.page}><nav aria-label="Products and decisions" className={s.toolbar}><button aria-pressed={!decisions} onClick={()=>setDecisions(false)}>Product candidates</button><button aria-pressed={decisions} onClick={()=>setDecisions(true)}>Owner decisions</button></nav>{decisions?<Approvals initialMission={initialMission}/>:<Portfolio/>}</div>;
}
