import type { Channel,ProviderRegistration } from "./types.js";
export class ProviderRegistry {private values=new Map<string,ProviderRegistration>();save(v:ProviderRegistration){this.values.set(v.providerId,v);return v}get(id:string){return this.values.get(id)}list(){return [...this.values.values()]}byChannel(channel:Channel){return this.list().filter(x=>x.channel===channel)}}
