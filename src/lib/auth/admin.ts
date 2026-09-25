import { cookies } from "next/headers";
export type AdminAccess={authorized:boolean;reason:"provider_unconfigured"|"missing_session"};
export async function requireAdminAccess():Promise<AdminAccess>{
  // Fail closed until a real auth provider verifies an authenticated admin role server-side.
  // Never authorize from a client-controlled role, query string, localStorage, or public env var.
  const issuer=process.env.AUTH_ISSUER_URL?.trim();
  const audience=process.env.AUTH_AUDIENCE?.trim();
  if(!issuer||!audience)return {authorized:false,reason:"provider_unconfigured"};
  await cookies();
  return {authorized:false,reason:"missing_session"};
}
