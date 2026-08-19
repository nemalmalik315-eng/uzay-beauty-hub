import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Uzay Beauty Hub | Premium Salon Services",
  description:
    "Uzay Beauty Hub — Your destination for premium hair, skin, nail, and makeup services. Book your appointment today.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream font-body antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
