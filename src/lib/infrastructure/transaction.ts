export type TransactionIsolation="SERIALIZABLE";
export interface TransactionContext{
 query<T=unknown>(sql:string,params?:readonly unknown[]):Promise<T[]>;
 execute(sql:string,params?:readonly unknown[]):Promise<{rowCount:number}>;
}
export interface TransactionAdapter{
 run<T>(isolation:TransactionIsolation,work:(tx:TransactionContext)=>Promise<T>):Promise<T>;
}
export class UnconfiguredTransactionAdapter implements TransactionAdapter{
 async run<T>(_isolation:TransactionIsolation,_work:(tx:TransactionContext)=>Promise<T>):Promise<T>{
  throw new Error("PostgreSQL transaction adapter is not configured");
 }
}
