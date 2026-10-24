'use strict';
const fs=require('node:fs');
const {MembershipController}=require('../runtime-membership-controller.cjs');
const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const mode=process.argv[3];
const c=new MembershipController(config);c.on('fault',()=>{});
if(mode==='crash-after-commit')c.launch('primary',{afterCommit(){process.exit(71);}});
else{
 let ready=0;c.on('ready',()=>{if(++ready===config.roles.length){fs.writeFileSync(process.argv[4],JSON.stringify(c.read()));process.send?.({ready:true});}});
 for(const role of config.roles)c.launch(role.role);
}
