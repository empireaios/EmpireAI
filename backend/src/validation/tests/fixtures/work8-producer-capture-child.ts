import {TaskQueue} from '../../../brain/task-queue.js';
import {DatabaseSync} from 'node:sqlite';
const database=new DatabaseSync(process.env.WORK8_PRODUCER_AUDIT!);
database.exec('CREATE TABLE audit(action TEXT)');
const queue=new TaskQueue({host:'127.0.0.1',port:Number(process.env.WORK8_REDIS_PORT)}, {write(event:{action:string}){database.prepare('INSERT INTO audit VALUES(?)').run(event.action);}} as any);
const add=queue.queue.add.bind(queue.queue);
let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});
process.on('message',(message:any)=>{if(message?.action==='release')release();});
queue.queue.add=async(...args:Parameters<typeof add>)=>{process.send!({event:'admitted-before-add'});await held;return add(...args);};
try{
 await queue.enqueue({type:'tool.execute',workspaceId:'isolated-producer',toolName:'fixture-no-consumer',input:{},correlationId:'capture-race'},{jobId:'admitted-job'});
 process.send!({event:'settled'});
}catch(error){process.send?.({event:'failed',error:String(error)});process.exitCode=1;}
finally{await queue.close();database.close();process.disconnect();}
