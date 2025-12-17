import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Azure Change Impact Radar",
  description: "Understand the real impact of Azure VM changes before execution",
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
