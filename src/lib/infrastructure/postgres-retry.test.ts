import {describe,it,expect,vi} from "vitest";
import {PostgresTransactionAdapter} from "./postgres-transaction";
describe("bounded PostgreSQL transaction retries",()=>{
 it.each(["40001","40P01"])("retries only a rolled-back %s on a new client",async code=>{
  const queries=[vi.fn().mockResolvedValue({rows:[],rowCount:1}),vi.fn().mockResolvedValue({rows:[],rowCount:1})];let connects=0;
  const pool={connect:async()=>({query:queries[connects++],release:vi.fn()})};let calls=0;
  const result=await new PostgresTransactionAdapter(pool).run("SERIALIZABLE",async()=>{if(calls++===0)throw Object.assign(new Error('aborted'),{code});return 'replayed'});
  expect(result).toBe('replayed');expect(connects).toBe(2);expect(queries[0].mock.calls.map(c=>c[0])).toContain('ROLLBACK');expect(queries[0].mock.calls.map(c=>c[0])).not.toContain('COMMIT');
 });
 it("never retries an ambiguous commit failure",async()=>{
  const q=vi.fn(async(sql:string)=>{if(sql==='COMMIT')throw Object.assign(new Error('connection lost'),{code:'08006'});return {rows:[],rowCount:1}}),connect=vi.fn(async()=>({query:q,release:vi.fn()})),work=vi.fn(async()=>1);
  await expect(new PostgresTransactionAdapter({connect}).run('SERIALIZABLE',work)).rejects.toThrow('connection lost');expect(work).toHaveBeenCalledTimes(1);expect(connect).toHaveBeenCalledTimes(1);
 });
 it("does not retry if rollback could not be confirmed",async()=>{
  const q=vi.fn(async(sql:string)=>{if(sql==='ROLLBACK')throw new Error('connection lost');return {rows:[],rowCount:1}}),work=vi.fn(async()=>{throw Object.assign(new Error('aborted'),{code:'40001'})});
  await expect(new PostgresTransactionAdapter({connect:async()=>({query:q,release:vi.fn()})}).run('SERIALIZABLE',work)).rejects.toThrow('aborted');expect(work).toHaveBeenCalledTimes(1);
 });
 it("bounds abort retries to three attempts",async()=>{const work=vi.fn(async()=>{throw Object.assign(new Error('aborted'),{code:'40001'})});await expect(new PostgresTransactionAdapter({connect:async()=>({query:vi.fn().mockResolvedValue({rows:[],rowCount:1}),release:vi.fn()})}).run('SERIALIZABLE',work)).rejects.toMatchObject({code:'TRANSACTION_RETRY_EXHAUSTED'});expect(work).toHaveBeenCalledTimes(3)});
});
