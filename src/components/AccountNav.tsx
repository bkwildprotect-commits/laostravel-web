import Link from "next/link";import type { Locale } from "@/i18n/locales";
const items=[["profile","Profile"],["trips","Trips"],["saved","Saved"],["coupons","Coupons"],["coins","Coins"],["reviews","Reviews"],["settings","Settings"]];
export function AccountNav({locale}:{locale:Locale}){return <nav className="accountNav" aria-label="Traveller account">{items.map(([path,label])=><Link key={path} href={"/"+locale+"/"+path}>{label}</Link>)}</nav>}
