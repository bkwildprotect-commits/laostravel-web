export type HealthStatus="ready"|"unconfigured"|"error";
export type AdapterHealth={name:"database"|"auth"|"storage";status:HealthStatus;detail:string};
export interface DatabaseAdapter{health():Promise<AdapterHealth>}
export interface AuthAdapter{health():Promise<AdapterHealth>}
export interface ObjectStorageAdapter{health():Promise<AdapterHealth>}
export type InfrastructureAdapters={database:DatabaseAdapter;auth:AuthAdapter;storage:ObjectStorageAdapter};
