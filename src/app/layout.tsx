import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./fullscreen-pdf.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bhem.ca'),
  title: {
    default: 'BHEM - Black Heritage Experience Manitoba',
    template: '%s | BHEM - Black Heritage Experience Manitoba'
  },
  description: 'Black Heritage Experience Manitoba (BHEM) - Celebrating and preserving African heritage, culture, and history in Manitoba, Canada.',
  keywords: ['Black Heritage', 'African Canadian Heritage', 'Manitoba History', 'Cultural Heritage', 'Emancipation', 'Black History Museum', 'BHEM', 'African Communities Manitoba', 'Black History Canada', 'Heritage Preservation', 'Cultural Education', 'Community Heritage'],
  authors: [{ name: 'African Communities of Manitoba Inc.' }],
  creator: 'African Communities of Manitoba Inc.',
  publisher: 'African Communities of Manitoba Inc.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://bhem.ca',
    siteName: 'BHEM - Black Heritage Experience Manitoba',
    title: 'BHEM - Black Heritage Experience Manitoba',
    description: 'Celebrating and preserving African heritage, culture, and history in Manitoba, Canada. Join our journey to emancipation and discover our rich cultural legacy.',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'BHEM - Black Heritage Experience Manitoba Logo',
      },
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'BHEM - Black Heritage Experience Manitoba',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BHEM - Black Heritage Experience Manitoba',
    description: 'Celebrating and preserving African heritage, culture, and history in Manitoba, Canada.',
    images: ['/icons/icon-512x512.png'],
  },
  alternates: {
    canonical: 'https://bhem.ca',
  },
  verification: {
    google: 'your-google-verification-code-here',
  },
  other: {
    'msvalidate.01': 'your-bing-verification-code-here',
    'google-site-verification': 'your-google-verification-code-here',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme colors */}
        <meta name="theme-color" content="#44200F" />
        <meta name="msapplication-TileColor" content="#44200F" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Mobile Web App */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BHEM" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        
        {/* Security */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "BHEM - Black Heritage Experience Manitoba",
              "alternateName": "BHEM",
              "url": "https://bhem.ca",
              "logo": "https://bhem.ca/icons/icon-512x512.png",
              "description": "Black Heritage Experience Manitoba is dedicated to celebrating and preserving Black heritage in Manitoba, Canada.",
              "foundingLocation": {
                "@type": "Place",
                "name": "Manitoba, Canada"
              },
              "areaServed": {
                "@type": "Place",
                "name": "Manitoba, Canada"
              },
              "sameAs": []
            })
          }}
        />
        
        {/* Structured Data - Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "BHEM - Black Heritage Experience Manitoba",
              "url": "https://bhem.ca",
              "description": "Official website of Black Heritage Experience Manitoba showcasing our brand and mission to celebrate and preserve Black heritage in Manitoba, Canada.",
              "publisher": {
                "@type": "Organization",
                "name": "BHEM - Black Heritage Experience Manitoba"
              },
              "inLanguage": "en-CA"
            })
          }}
        />

        {/* Service Worker Registration Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                    })
                    .catch(function(registrationError) {
                      console.warn('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
        
        
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
