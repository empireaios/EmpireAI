'use strict';
const net=require('node:net');
function command(url,args,{name}={}){
 const u=new URL(url);if(u.protocol!=='redis:'||u.username||u.password||!['','/','/0'].includes(u.pathname))throw Error('ISOLATED_REDIS_ONLY');
 const encode=a=>'*'+a.length+'\r\n'+a.map(v=>{const x=String(v);return '$'+Buffer.byteLength(x)+'\r\n'+x+'\r\n';}).join('');
 return new Promise((resolve,reject)=>{
  const socket=net.createConnection({host:u.hostname,port:Number(u.port||6379)});let data=Buffer.alloc(0),named=!name;
  const timer=setTimeout(()=>finish(Error('REDIS_EXAMINATION_TIMEOUT')),3000);
  const finish=(error,value)=>{clearTimeout(timer);socket.destroy();error?reject(error):resolve(value);};
  socket.on('error',finish);socket.on('connect',()=>socket.write(encode(name?['CLIENT','SETNAME',name]:args)));
  socket.on('data',bytes=>{data=Buffer.concat([data,bytes]);const end=data.indexOf('\r\n');if(end<0)return;const line=data.subarray(0,end).toString();
   if(line[0]==='-')return finish(Error('REDIS_EXAMINATION_REFUSED'));
   let value;if(line[0]==='$'){const count=Number(line.slice(1));if(count===-1)value=null;else{if(data.length<end+2+count+2)return;value=data.subarray(end+2,end+2+count).toString();}}
   else if(line[0]===':')value=Number(line.slice(1));else value=line.slice(1);
   if(!named){named=true;data=Buffer.alloc(0);socket.write(encode(args));}else finish(null,value);
  });
 });
}
module.exports={command};
