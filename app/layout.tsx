import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import { AppBootstrap } from "@/components/app/AppBootstrap";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import "@xyflow/react/dist/style.css";
import "katex/dist/katex.min.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  weight: ["400", "500", "600", "700"],
  subsets: ["devanagari"],
  variable: "--font-noto-devanagari",
});



export const metadata: Metadata = {
  title: "Vidya",
  description: "AI-powered study assistant for Indian students."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a56db" />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${notoSansDevanagari.variable} font-sans`}>
        <AppBootstrap />
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
