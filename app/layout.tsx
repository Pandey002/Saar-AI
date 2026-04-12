import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import { AppBootstrap } from "@/components/app/AppBootstrap";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import "@xyflow/react/dist/style.css";
import "katex/dist/katex.min.css";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
});

export const metadata: Metadata = {
  title: "Saar AI",
  description: "AI-powered study assistant for Indian students."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a56db" />
      </head>
      <body suppressHydrationWarning className={libreBaskerville.variable}>
        <AppBootstrap />
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
