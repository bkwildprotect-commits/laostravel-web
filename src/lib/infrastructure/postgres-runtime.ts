import {Pool} from "pg";import type {PgPoolLike} from "./postgres-transaction";
declare global{var __laosTravelPgPool:Pool|undefined}
export class PostgresRuntimeConfigurationError extends Error{constructor(){super("DATABASE_URL is not configured")}}
export function getPostgresPool(env:Record<string,string|undefined>=process.env):PgPoolLike{
 const connectionString=env.DATABASE_URL?.trim();if(!connectionString)throw new PostgresRuntimeConfigurationError();
 if(!globalThis.__laosTravelPgPool){globalThis.__laosTravelPgPool=new Pool({connectionString,max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:5000,application_name:"laostravel-web"});globalThis.__laosTravelPgPool.on("error",error=>console.error("PostgreSQL idle client error",error))}
 return globalThis.__laosTravelPgPool;
}
