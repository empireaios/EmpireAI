import {EmpireDatabase} from '../../../brain/sqlite-database.js';
let db:EmpireDatabase;
try{db=new EmpireDatabase(process.argv[2]!);process.send?.({kind:'opened'});}catch(error){process.send?.({kind:'refused',error:String(error)});process.disconnect();}
process.on('message',async(raw:any)=>{try{
 if(raw.action==='write'){db.exec(`INSERT INTO events VALUES (${Number(raw.id)})`);await db.requestCriticalPersist();process.send?.({kind:'written'});}
 if(raw.action==='close'){db.close();process.send?.({kind:'closed'});process.disconnect();}
}catch(error){process.send?.({kind:'refused',error:String(error)});}});
