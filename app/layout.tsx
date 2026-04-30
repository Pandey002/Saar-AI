import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import Script from "next/script";
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
  metadataBase: new URL('https://vidyabot.in'),
  title: {
    default: 'Vidya — AI Study Assistant for JEE, NEET & Board Exams',
    template: '%s | Vidya'
  },
  description: 'Vidya turns your notes, PDFs, and doubts into structured summaries, explanations, flashcards, and mock tests. Built for JEE, NEET, and Board exam students.',
  keywords: [
    'AI study assistant India',
    'JEE study tool',
    'NEET preparation AI',
    'AI notes summarizer',
    'study app for Indian students',
    'AI flashcards JEE NEET',
    'board exam preparation AI',
    'Hinglish study app',
    'AI tutor India',
    'concept explanation AI'
  ],
  authors: [{ name: 'Vidya' }],
  creator: 'Vidya',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://vidyabot.in',
    siteName: 'Vidya',
    title: 'Vidya — AI Study Assistant for JEE, NEET & Board Exams',
    description: 'Turn your notes into structured study material. Summaries, explanations, flashcards, and mock tests — powered by AI, built for Indian students.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vidya — AI Study Assistant'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vidya — AI Study Assistant for JEE, NEET & Board Exams',
    description: 'Turn your notes into structured study material. Built for Indian students.',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: 'https://vidyabot.in'
  }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://vidyabot.in/#app",
        "name": "Vidya",
        "url": "https://vidyabot.in",
        "description": "AI-powered study assistant for JEE, NEET, and Board exam students in India",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR"
        },
        "audience": {
          "@type": "EducationalAudience",
          "educationalRole": "student"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://vidyabot.in/#org",
        "name": "Vidya",
        "url": "https://vidyabot.in",
        "logo": "https://vidyabot.in/logo.png",
        "sameAs": []
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is Vidya?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Vidya is an AI study assistant that converts notes, PDFs, and doubts into structured summaries, explanations, flashcards, and mock tests for JEE, NEET, and Board exam students."
            }
          },
          {
            "@type": "Question",
            "name": "Is Vidya free to use?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Vidya offers free access with all features unlocked during the current access period."
            }
          },
          {
            "@type": "Question",
            "name": "Does Vidya support Hindi and Hinglish?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Vidya supports both English and Hinglish output so students can study in the language they think in."
            }
          }
        ]
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#059669" />
        <script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4998895525764161"
          crossOrigin="anonymous"
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
