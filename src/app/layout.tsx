import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components";

export const metadata: Metadata = {
  title: "AZpact - Azure VM Change Impact Radar | Predict Before You Act",
  description: "Free Azure VM change impact analysis tool. Predict reboot, downtime, and risks before executing resize, redeploy, disk operations, encryption, zone changes, and more. Make informed decisions with confidence.",
  keywords: [
    "Azure VM",
    "Azure Virtual Machine",
    "Azure resize",
    "VM resize impact",
    "Azure downtime",
    "Azure reboot",
    "VM migration",
    "Azure change management",
    "VM impact analysis",
    "Azure operations",
    "disk resize",
    "VM redeploy",
    "Azure encryption",
    "availability zone",
    "Azure planning",
    "infrastructure change",
  ],
  authors: [{ name: "AZpact" }],
  creator: "AZpact",
  publisher: "AZpact",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "AZpact - Azure VM Change Impact Radar",
    description: "Free tool to predict Azure VM change impacts. Analyze reboot, downtime, and risks before executing operations. 17+ scenarios supported.",
    type: "website",
    locale: "en_US",
    url: "https://azpact.dev",
    siteName: "AZpact",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "AZpact - Azure Change Impact Radar - Predict VM changes before execution",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AZpact - Azure VM Change Impact Radar",
    description: "Free tool to predict Azure VM change impacts. Analyze reboot, downtime, and risks before execution.",
    images: ["/og-image.svg"],
    creator: "@azpact",
  },
  alternates: {
    canonical: "https://azpact.dev",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://azpact.dev"),
  category: "Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AZpact',
    alternateName: 'Azure Change Impact Radar',
    description: 'Free Azure VM change impact analysis tool. Predict reboot, downtime, and risks before executing operations.',
    url: 'https://azpact.dev',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'VM Resize Impact Analysis',
      'Disk Operation Impact',
      'Encryption Change Analysis',
      'Availability Zone Migration',
      'Redeploy Impact Assessment',
      '17+ Azure Change Scenarios',
    ],
    author: {
      '@type': 'Organization',
      name: 'AZpact',
    },
  };

  return (
    <html lang="en">
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Note: Security headers (CSP, X-Frame-Options, X-Content-Type-Options) are configured via HTTP headers */}
        {/* See staticwebapp.config.json for Azure Static Web Apps configuration */}
      </head>
      <body className="antialiased text-white">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
