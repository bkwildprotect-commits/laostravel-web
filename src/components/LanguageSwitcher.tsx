import { locales,type Locale } from "@/i18n/locales";
const labels:Record<Locale,string>={en:"English",lo:"ລາວ",th:"ไทย",vi:"Tiếng Việt",zh:"中文",fr:"Français",ko:"한국어"};
export function LanguageSwitcher({locale}:{locale:Locale}){return <label className="languageSwitcher"><span className="srOnly">Language</span><select value={locale} onChange={()=>{}} aria-label="Language">{locales.map(l=><option key={l} value={l}>{l===locale?"✓ ":""}{labels[l]}</option>)}</select></label>}
