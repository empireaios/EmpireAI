import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';

// SQL.js replaces the database inode on export, so locking that inode cannot
// protect a second process's stale RAM. A stable adjacent SQLite lock remains
// held across every export. Only cooperating current-code processes are fenced.
const owners=new Map<string,{db:DatabaseSync;references:number;dev:number;ino:number}>();
export function acquireSqliteProcessOwner(identity:string){
 const file=identity+'.sqljs-owner.sqlite';
 fs.mkdirSync(path.dirname(identity),{recursive:true});
 const assertData=()=>{if(fs.existsSync(identity)){const s=fs.lstatSync(identity);if(!s.isFile()||s.nlink!==1)throw Error('SQLJS_OWNER_DATABASE_ALIAS_UNSAFE');}};
 assertData();
 let owner=owners.get(file);
 if(!owner){
  if(fs.existsSync(file)){const s=fs.lstatSync(file);if(!s.isFile()||s.nlink!==1)throw Error('SQLJS_OWNER_LOCK_UNSAFE');}
  let db:DatabaseSync|undefined;
  try{db=new DatabaseSync(file,{timeout:0,allowExtension:false});db.exec('PRAGMA journal_mode=DELETE; BEGIN EXCLUSIVE');
   const s=fs.lstatSync(file);if(!s.isFile()||s.nlink!==1)throw Error('SQLJS_OWNER_LOCK_UNSAFE');
   owner={db,references:0,dev:s.dev,ino:s.ino};owners.set(file,owner);
  }catch(error){db?.close();throw Error('SQLJS_PROCESS_OWNERSHIP_UNAVAILABLE',{cause:error});}
 }
 const retained=owner;
 const current=fs.lstatSync(file);if(!current.isFile()||current.nlink!==1||current.dev!==retained.dev||current.ino!==retained.ino)throw Error('SQLJS_PROCESS_OWNERSHIP_LOST');
 retained.references++;
 let released=false;
 const assertOwned=()=>{if(released||owners.get(file)!==retained)throw Error('SQLJS_PROCESS_OWNERSHIP_LOST');assertData();const s=fs.lstatSync(file);if(!s.isFile()||s.nlink!==1||s.dev!==retained.dev||s.ino!==retained.ino)throw Error('SQLJS_PROCESS_OWNERSHIP_LOST');};
 return {assertOwned,release(){if(released)return;released=true;if(--retained.references===0){owners.delete(file);retained.db.close();}}};
}
