import { notFound } from "next/navigation";
import { HomePage } from "@/components/HomePage";
import { locales,type Locale } from "@/i18n/locales";
export function generateStaticParams(){return locales.map(locale=>({locale}))}
export default async function LocalizedHome({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!locales.includes(locale as Locale))notFound();return <HomePage locale={locale as Locale}/>}
