import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Vasuli AI — Autonomous MSMED Delayed Payment Recovery & Resolution",
  description:
    "Statutory Section 15 & 16 MSMED Act 2006 engine with Amazon Textract OCR, 3x Penal Compounding Interest calculator, and autonomous multi-tier settlement agent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-[#0f172a] text-slate-100 flex flex-col font-sans antialiased selection:bg-[#ff9900] selection:text-slate-950">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
