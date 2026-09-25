import type {TransactionAdapter,TransactionContext,TransactionIsolation} from "./transaction";
export interface PgQueryResult<T>{rows:T[];rowCount:number|null}
export interface PgClientLike{query<T=unknown>(text:string,params?:readonly unknown[]):Promise<PgQueryResult<T>>;release():void}
export interface PgPoolLike{connect():Promise<PgClientLike>}
class PgTransactionContext implements TransactionContext{
 constructor(private client:PgClientLike){}
 async query<T=unknown>(sql:string,params:readonly unknown[]=[]):Promise<T[]>{return (await this.client.query<T>(sql,params)).rows}
 async execute(sql:string,params:readonly unknown[]=[]){const r=await this.client.query(sql,params);return {rowCount:r.rowCount??0}}
}
export class PostgresTransactionAdapter implements TransactionAdapter{
 constructor(private pool:PgPoolLike){}
 async run<T>(isolation:TransactionIsolation,work:(tx:TransactionContext)=>Promise<T>):Promise<T>{
  const client=await this.pool.connect();try{await client.query("BEGIN");await client.query("SET TRANSACTION ISOLATION LEVEL "+isolation);const value=await work(new PgTransactionContext(client));await client.query("COMMIT");return value}catch(error){try{await client.query("ROLLBACK")}catch{}throw error}finally{client.release()}
 }
}
