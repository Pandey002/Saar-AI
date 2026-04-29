import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import { AppBootstrap } from "@/components/app/AppBootstrap";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Clarity } from "@/components/analytics/Clarity";
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
    default: "Vidya | AI Study Assistant, Smart Notes & Mock Tests",
    template: "%s | Vidya AI"
  },
  description: "Vidya is an AI-powered study sanctuary for students. Transform your notes, PDFs, and textbooks into summaries, flashcards, assignments, and mock tests with Socratic AI tutoring.",
  keywords: [
    "notes", "education", "summary", "assignment", "mock test", "study", 
    "AI study assistant", "PDF summarizer", "Smart note taker", "Exam preparation AI", 
    "Learning workflow", "Academic productivity", "Conceptual understanding", "Spaced repetition", 
    "Flashcard generator", "AI tutor", "Educational insights", "Study material structuring", 
    "Personalized learning", "Revision aid", "Competitive exam prep", "Homework helper", 
    "Text analysis for students", "First principles learning", "Syllabus manager", 
    "Intelligent research tool", "JEE Mains", "NEET Prep", "UPSC Study Material", "CBSE AI tutor",
    "VidyaBot", "Study Sanctuary", "Active Recall"
  ],
  authors: [{ name: "Vidya Editorial" }],
  creator: "Vidya Editorial",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://vidyabot.in",
    siteName: "Vidya",
    title: "Vidya | AI Study Assistant - Learn Fast, Skip Overwhelm",
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
    title: "Vidya | AI Study Assistant - Learn Fast, Skip Overwhelm",
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
        <meta name="theme-color" content="#059669" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4998895525764161"
          crossorigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} ${notoSansDevanagari.variable} font-sans`}>
        <AppBootstrap />
        <OfflineBanner />
        {children}
        <Analytics />
        <SpeedInsights />
        <Clarity />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
      </body>
    </html>
  );
}
