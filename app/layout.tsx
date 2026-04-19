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
  metadataBase: new URL("https://vidyabot.in"),
  title: {
    default: "Vidya | Learn Fast, Skip Overwhelm",
    template: "%s | Vidya AI"
  },
  description: "Experience deep work with Vidya, the AI-powered study sanctuary for students. Featuring the Socratic Adhyapak tutor, intelligent flashcards, and automated summaries.",
  keywords: ["JEE Mains", "NEET Prep", "AI Study Assistant", "Socratic Tutor", "Intelligent Flashcards", "Indian Education AI", "VidyaBot", "Study Sanctuary", "Active Recall", "Mock Test Generator"],
  authors: [{ name: "Vidya Editorial" }],
  creator: "Vidya Editorial",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://vidyabot.in",
    siteName: "Vidya",
    title: "Vidya | Learn fast. Learn enough. Skip the overwhelm.",
    description: "Transform your notes into mastery. Vidya is an AI-powered sanctuary designed for focused, deep study with Socratic tutoring and automated recall.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vidya - The Academic Sanctuary for Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vidya | Learn fast. Learn enough. Skip the overwhelm.",
    description: "Deep focus. Higher scores. Vidya is the AI sanctuary for the modern student.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Vidya",
    "operatingSystem": "Web",
    "applicationCategory": "EducationalApplication",
    "description": "AI-powered study sanctuary for Indian students featuring Socratic tutoring and active recall tools.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    }
  };

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a56db" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${notoSansDevanagari.variable} font-sans`}>
        <AppBootstrap />
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
