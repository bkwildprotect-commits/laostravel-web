"use client";
import { usePathname,useRouter } from "next/navigation";
import { locales,type Locale } from "@/i18n/locales";
const labels:Record<Locale,string>={en:"English",lo:"ລາວ",th:"ไทย",vi:"Tiếng Việt",zh:"中文",fr:"Français",ko:"한국어"};
export function LanguageSwitcher({locale}:{locale:Locale}){const router=useRouter();const pathname=usePathname();function change(next:Locale){const parts=pathname.split("/");if(parts.length>1&&locales.includes(parts[1] as Locale))parts[1]=next;else parts.splice(1,0,next);router.push(parts.join("/")||"/"+next)}return <label className="languageSwitcher"><span className="srOnly">Language</span><select value={locale} onChange={e=>change(e.target.value as Locale)} aria-label="Language">{locales.map(l=><option key={l} value={l}>{l===locale?"✓ ":""}{labels[l]}</option>)}</select></label>}
