import type {AdapterHealth,AuthAdapter,DatabaseAdapter,ObjectStorageAdapter} from "../types";
function state(name:AdapterHealth["name"],required:string[]):AdapterHealth{const missing=required.filter(k=>!process.env[k]?.trim());return missing.length?{name,status:"unconfigured",detail:"Missing: "+missing.join(", ")}:{name,status:"unconfigured",detail:"Environment configured; provider connection and permissions are not verified by this placeholder adapter."}}
export class UnconfiguredDatabaseAdapter implements DatabaseAdapter{async health(){return state("database",["DATABASE_URL"])}}
export class UnconfiguredAuthAdapter implements AuthAdapter{async health(){return state("auth",["AUTH_ISSUER_URL","AUTH_AUDIENCE"])}}
export class UnconfiguredStorageAdapter implements ObjectStorageAdapter{async health(){return state("storage",["OBJECT_STORAGE_ENDPOINT","OBJECT_STORAGE_BUCKET"])}}
