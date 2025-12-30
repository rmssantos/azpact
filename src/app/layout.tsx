import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components";

export const metadata: Metadata = {
  title: "AZpact - Azure VM Change Impact Radar | Predict Before You Act",
  description: "Understand the real impact of Azure VM changes before execution. Analyze resize, redeploy, disk operations, and more.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "AZpact - Azure VM Change Impact Radar | Predict Before You Act",
    description: "Understand the real impact of Azure VM changes before execution. Analyze resize, redeploy, disk operations, and more.",
    type: "website",
    locale: "en_US",
    siteName: "AZpact",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "AZpact - Azure Change Impact Radar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AZpact - Azure VM Change Impact Radar | Predict Before You Act",
    description: "Understand the real impact of Azure VM changes before execution.",
    images: ["/og-image.svg"],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://azpact.dev"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
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
