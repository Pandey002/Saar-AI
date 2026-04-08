import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saar AI",
  description: "AI-powered study assistant for Indian students."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
