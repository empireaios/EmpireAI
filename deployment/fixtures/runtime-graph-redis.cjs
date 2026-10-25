'use strict';
// Only the graph examination's isolated synthetic Redis capability is accepted.
// The previously accepted journal fixture is deliberately unchanged.
const net=require('node:net');
function command(url,args,expectedHost='journal-redis'){
 if(!['journal-redis','target-redis'].includes(expectedHost))throw Error('ISOLATED_GRAPH_REDIS_HOST');
 const u=new URL(url);
 if(u.protocol!=='redis:'||![expectedHost,'127.0.0.1'].includes(u.hostname)||u.username||u.password!=='work8-synthetic-only'||u.pathname!=='/0'||u.search||u.hash||!['["PING"]','["INFO","server"]'].includes(JSON.stringify(args)))throw Error('ISOLATED_GRAPH_REDIS_ONLY');
 const encode=a=>'*'+a.length+'\r\n'+a.map(v=>'$'+Buffer.byteLength(v)+'\r\n'+v+'\r\n').join('');
 return new Promise((resolve,reject)=>{
  const socket=net.createConnection({host:u.hostname,port:Number(u.port||6379)});let data=Buffer.alloc(0),authenticated=false,done=false;
  const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);socket.destroy();error?reject(error):resolve(value);};
  const timer=setTimeout(()=>finish(Error('REDIS_EXAMINATION_TIMEOUT')),3000);
  socket.on('error',()=>finish(Error('REDIS_EXAMINATION_CONNECTION')));
  socket.on('end',()=>finish(Error('REDIS_EXAMINATION_EOF')));
  socket.on('connect',()=>socket.write(encode(['AUTH','work8-synthetic-only'])));
  socket.on('data',bytes=>{
   data=Buffer.concat([data,bytes]);if(data.length>65536)return finish(Error('REDIS_EXAMINATION_LIMIT'));
   const end=data.indexOf('\r\n');if(end<0)return;const line=data.subarray(0,end).toString();let value,consumed=end+2;
   if(line[0]==='-')return finish(Error('REDIS_EXAMINATION_REFUSED'));
   if(line[0]==='+')value=line.slice(1);
   else if(line[0]==='$'&&/^\$[0-9]+$/.test(line)){
    const count=Number(line.slice(1));if(count>65536)return finish(Error('REDIS_EXAMINATION_LIMIT'));
    consumed=end+2+count+2;if(data.length<consumed)return;
    if(data.subarray(consumed-2,consumed).toString()!=='\r\n')return finish(Error('REDIS_EXAMINATION_PROTOCOL'));
    value=data.subarray(end+2,end+2+count).toString();
   }else return finish(Error('REDIS_EXAMINATION_PROTOCOL'));
   if(data.length!==consumed)return finish(Error('REDIS_EXAMINATION_PROTOCOL'));
   if(!authenticated){if(value!=='OK')return finish(Error('REDIS_EXAMINATION_AUTH'));authenticated=true;data=Buffer.alloc(0);socket.write(encode(args));}
   else finish(null,value);
  });
 });
}
module.exports={command};
