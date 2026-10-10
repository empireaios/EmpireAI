'use client';

import {useRef} from 'react';
import s from './business.module.css';

/** A separate, bounded reading surface. The source value is never projected or shortened. */
export function TechnicalEvidence({value,label='Technical evidence'}:{value:unknown;label?:string}) {
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 return <div className={s.evidenceLink}>
  <button ref={trigger} type="button" aria-haspopup="dialog" onClick={()=>dialog.current?.showModal()}>{label}</button>
  <dialog ref={dialog} className={s.evidenceDialog} aria-label={label} onClose={()=>trigger.current?.focus()}>
   <header><h2>Original technical record</h2><button type="button" autoFocus onClick={()=>dialog.current?.close()}>Close technical evidence</button></header>
   <p>Original read-only record · identifiers, precision and history preserved.</p>
   <pre>{JSON.stringify(value,null,2)??'No source record available.'}</pre>
  </dialog>
 </div>;
}
