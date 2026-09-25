import type {PgPoolLike} from "@/lib/infrastructure/postgres-transaction";import type {AuthIdentityStore} from "./oidc-authentication";
export class PostgresAuthIdentityStore implements AuthIdentityStore{
 constructor(private pool:PgPoolLike,private issuer:string){}
 async findActiveUserIdBySubject(subject:string):Promise<string|null>{
  const client=await this.pool.connect();try{const r=await client.query<{user_id:string}>("SELECT ai.user_id FROM auth_identities ai JOIN users u ON u.id=ai.user_id WHERE ai.issuer=$1 AND ai.subject=$2 AND u.status='ACTIVE' LIMIT 1",[this.issuer,subject]);return r.rows[0]?.user_id??null}finally{client.release()}
 }
}
