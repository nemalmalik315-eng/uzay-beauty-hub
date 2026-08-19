import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://uzaybeautyhub.com", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://uzaybeautyhub.com/services", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://uzaybeautyhub.com/book", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://uzaybeautyhub.com/gallery", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://uzaybeautyhub.com/contact", lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
  ];
}
