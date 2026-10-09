import type {TransactionAdapter,TransactionContext,TransactionIsolation} from "./transaction";
export interface PgQueryResult<T>{rows:T[];rowCount:number|null}
export interface PgClientLike{query<T=unknown>(text:string,params?:readonly unknown[]):Promise<PgQueryResult<T>>;release():void}
export interface PgPoolLike{connect():Promise<PgClientLike>}
export class TransactionRetryExhaustedError extends Error{readonly code="TRANSACTION_RETRY_EXHAUSTED";constructor(){super("Transaction is temporarily busy")}}
class PgTransactionContext implements TransactionContext{
 constructor(private client:PgClientLike){}
 async query<T=unknown>(sql:string,params:readonly unknown[]=[]):Promise<T[]>{return (await this.client.query<T>(sql,params)).rows}
 async execute(sql:string,params:readonly unknown[]=[]){const r=await this.client.query(sql,params);return {rowCount:r.rowCount??0}}
}
export class PostgresTransactionAdapter implements TransactionAdapter{
 constructor(private pool:PgPoolLike){}
 // Work must contain database operations only. Ambiguous network/COMMIT errors
 // are never replayed: only PostgreSQL's explicit transaction-abort codes are.
 async run<T>(isolation:TransactionIsolation,work:(tx:TransactionContext)=>Promise<T>):Promise<T>{
  for(let attempt=0;attempt<3;attempt++){
   const client=await this.pool.connect();let retry=false;
   try{await client.query("BEGIN");await client.query("SET TRANSACTION ISOLATION LEVEL "+isolation);const value=await work(new PgTransactionContext(client));await client.query("COMMIT");return value}
   catch(error){let rolledBack=false;try{await client.query("ROLLBACK");rolledBack=true}catch{}
    const code=(error as {code?:string})?.code;
    if(!rolledBack||(code!=="40001"&&code!=="40P01"))throw error;
    if(attempt===2)throw new TransactionRetryExhaustedError();retry=true;
   }finally{client.release()}
   if(retry)await new Promise(resolve=>setTimeout(resolve,10*(attempt+1)));
  }
  throw new TransactionRetryExhaustedError();
 }
}
