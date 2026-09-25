import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"LaosTravel",description:"Explore and book travel experiences in Laos."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
