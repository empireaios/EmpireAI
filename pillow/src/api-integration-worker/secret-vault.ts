import type { AuthMethod, CredentialRef } from "./types.js";
type Entry=CredentialRef&{secret:string};
export class SecretVault { private secrets=new Map<string,Entry>(); private count=0;
 storeSecret(providerId:string,authMethod:AuthMethod,secret:string):CredentialRef{if(!secret)throw new Error("Credential secret is required.");const ref={credentialId:`aiw-sec-${++this.count}`,providerId,authMethod,createdAt:new Date().toISOString()};this.secrets.set(ref.credentialId,{...ref,secret});return ref;}
 getSecretForRequest(credentialId:string){const entry=this.secrets.get(credentialId);if(!entry)throw new Error("Credential not found.");return entry.secret;}
 listCredentialRefs(){return [...this.secrets.values()].map(({credentialId,providerId,authMethod,createdAt})=>({credentialId,providerId,authMethod,createdAt}));}
 hasCredential(credentialId?:string){return !!credentialId&&this.secrets.has(credentialId);}
}
