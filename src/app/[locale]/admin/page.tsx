import { AdminDashboard } from "@/components/AdminDashboard";import { AdminAccessBlocked } from "@/components/AdminAccessBlocked";import { requireAdminAccess } from "@/lib/auth/admin";
export default async function AdminPage(){const access=await requireAdminAccess();if(!access.authorized)return <AdminAccessBlocked/>;return <main className="container adminPage"><AdminDashboard/></main>}
