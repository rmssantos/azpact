import type { Metadata } from "next";
import "./globals.css";

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
  metadataBase: new URL("https://calm-island-0629bae10.3.azurestaticapps.net"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased text-white">
        {children}
      </body>
    </html>
  );
}
