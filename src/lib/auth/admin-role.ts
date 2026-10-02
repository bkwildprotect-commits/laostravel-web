import type {Pool} from "pg";
import type {AuthenticationAdapter,AuthenticatedUser} from "./authentication";

export type AdminRole="ADMIN"|"LOCATION_REVIEWER";
export class AdminAuthorizationError extends Error{constructor(){super("ADMIN_ACCESS_DENIED")}}

export async function requireAdminRole(request:Request,input:{auth:AuthenticationAdapter;pool:Pool;allowedRoles:AdminRole[]}):Promise<AuthenticatedUser>{
 const user=await input.auth.authenticate(request);
 const result=await input.pool.query<{allowed:boolean}>(`
  SELECT EXISTS(
   SELECT 1 FROM admin_role_assignments
   WHERE user_id=$1 AND status='ACTIVE' AND role=ANY($2::text[])
  ) AS allowed
 `,[user.userId,input.allowedRoles]);
 if(!result.rows[0]?.allowed)throw new AdminAuthorizationError();
 return user;
}
