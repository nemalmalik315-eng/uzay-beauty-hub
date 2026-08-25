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
  alternates: {
    canonical: "https://uzaybeautyhub.com",
  },
  verification: {
    google: "oF7hHFLjuEf8KugFGM09QvujFztisLX5cVegNNJLPNo",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  name: "Uzay Beauty Hub",
  image: "https://uzaybeautyhub.com/gallery/hero-salon.jpg",
  url: "https://uzaybeautyhub.com",
  telephone: "+923344198243",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "112B, Block B, Nasheman-e-Iqbal Phase 2",
    addressLocality: "Lahore",
    postalCode: "54000",
    addressCountry: "PK",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 31.4,
    longitude: 74.2,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Friday", "Sunday"],
      opens: "11:00",
      closes: "19:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Saturday"],
      opens: "11:00",
      closes: "19:30",
    },
  ],
  sameAs: [
    "https://wa.me/923344198243",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
