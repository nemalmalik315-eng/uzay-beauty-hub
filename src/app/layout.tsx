import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://uzaybeautyhub.com"),
  title: "Uzay Beauty Hub | Premium Salon Services",
  description:
    "Uzay Beauty Hub — Premium hair, skin, nails & bridal makeup in Lahore. Book your appointment online today.",
  keywords: [
    "beauty salon Lahore", "hair salon Lahore", "bridal makeup Lahore",
    "nail salon", "facial", "hair treatment", "Uzay Beauty Hub",
  ],
  openGraph: {
    type: "website",
    url: "https://uzaybeautyhub.com",
    siteName: "Uzay Beauty Hub",
    title: "Uzay Beauty Hub | Premium Salon Services",
    description:
      "Premium hair, skin, nails & bridal makeup in Lahore. Book your appointment online today.",
    images: [
      {
        url: "/gallery/hero-salon.jpg",
        width: 1200,
        height: 630,
        alt: "Uzay Beauty Hub Salon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Uzay Beauty Hub | Premium Salon Services",
    description:
      "Premium hair, skin, nails & bridal makeup in Lahore. Book your appointment online today.",
    images: ["/gallery/hero-salon.jpg"],
  },
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
