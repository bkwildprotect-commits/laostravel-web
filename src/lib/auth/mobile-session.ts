import type {Pool} from "pg";
import {AuthenticationError} from "./authentication";

/** Reads only the authenticated user's profile and existing memberships.
 * It never provisions an identity, grants a role or approves an application. */
export async function readMobileSession(pool:Pool,userId:string){
 const user=await pool.query<{id:string;email:string;display_name:string|null}>(
  "SELECT u.id,u.email,p.display_name FROM users u LEFT JOIN user_profiles p ON p.user_id=u.id WHERE u.id=$1 AND u.status='ACTIVE'",[userId]);
 if(!user.rows[0])throw new AuthenticationError("AUTH_INVALID");
 const partners=await pool.query<{id:string;name:string;verification_status:string;business_status:string}>(
  "SELECT p.id,p.name,p.verification_status,p.business_status FROM partner_members pm JOIN partners p ON p.id=pm.partner_id WHERE pm.user_id=$1 ORDER BY p.id",[userId]);
 const application=await pool.query<{status:string}>(
  "SELECT status FROM partner_applications WHERE applicant_user_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1",[userId]);
 return {userId:user.rows[0].id,email:user.rows[0].email,displayName:user.rows[0].display_name??"",partners:partners.rows.map(p=>({partnerId:p.id,name:p.name,verificationStatus:p.verification_status,businessStatus:p.business_status,canManage:p.verification_status==="APPROVED"&&p.business_status==="ACTIVE"})),applicationStatus:application.rows[0]?.status??null};
}
