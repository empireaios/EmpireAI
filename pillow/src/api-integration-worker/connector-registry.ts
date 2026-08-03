import type { ApiType, Connector, Protocol } from "./types.js";
export class ConnectorRegistry {private connectors=new Map<ApiType,Connector>();register(providerType:ApiType,protocols:Protocol[]=["rest","graphql","webhook"]){this.connectors.set(providerType,{providerType,protocols});}get(providerType:ApiType){return this.connectors.get(providerType);}list(){return [...this.connectors.values()];}}
