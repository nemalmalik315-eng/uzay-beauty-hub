"use client";

import { useState } from "react";
import Link from "next/link";

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  price_max?: number;
  duration: number;
  duration_max?: number;
  description: string;
}

const CATEGORY_ORDER = [
  "Hair Cut",
  "Hair Treatment",
  "Hair Colour",
  "Facials",
  "Cleansing",
  "Polisher",
  "Scrub & Mask",
  "Body Waxing",
  "Face Waxing",
  "Threading",
  "Manicure & Pedicure",
  "Massage",
  "Makeup",
  "Kids",
  "Mehndi",
  "Assistant Bridal",
  "Signature Bridal",
];

const TABS = [
  { label: "All", categories: null },
  { label: "Hair", categories: ["Hair", "Hair Color", "Hair Treatment", "Dye Application"] },
  { label: "Waxing", categories: ["Body Waxing", "Face Waxing"] },
  { label: "Threading", categories: ["Threading"] },
  { label: "Skin & Facials", categories: ["Facials", "Cleansing", "Polisher", "Scrub & Mask"] },
  { label: "Nails", categories: ["Manicure & Pedicure"] },
  { label: "Massage", categories: ["Massage"] },
  { label: "Mehndi", categories: ["Mehndi"] },
  { label: "Bridal", categories: ["Assistant Bridal", "Signature Bridal"] },
  { label: "Makeup & Kids", categories: ["Makeup", "Kids"] },
];

export default function ServicesFilter({ services }: { services: Service[] }) {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");

  const isSearching = query.trim().length > 0;

  const searchResults = isSearching
    ? services.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.category.toLowerCase().includes(query.toLowerCase()) ||
        s.description?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredCategories = (() => {
    if (isSearching) {
      const cats = [...new Set(searchResults.map((s) => s.category))];
      return cats.sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a);
        const bi = CATEGORY_ORDER.indexOf(b);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    }
    const tab = TABS.find((t) => t.label === active);
    const allowedCats = tab?.categories ?? null;
    const allCategories = [...new Set(services.map((s) => s.category))];
    const relevant = allowedCats
      ? allCategories.filter((c) => allowedCats.includes(c))
      : allCategories;
    return relevant.sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  })();

  const visibleServices = isSearching
    ? searchResults
    : filteredCategories.flatMap((cat) => services.filter((s) => s.category === cat));

  const ServiceCard = ({ service }: { service: Service }) => {
    const descItems = service.description?.split(" · ") ?? [];
    const durationLabel = service.duration > 0
      ? `${service.duration}${service.duration_max ? `–${service.duration_max}` : ""} min`
      : null;
    return (
      <div className="card flex items-start justify-between gap-4 group hover:border-gold/40 hover:shadow-md transition-all duration-200">
        <div className="flex-1">
          <h3 className="font-semibold text-charcoal text-lg group-hover:text-gold transition-colors">
            {service.name}
          </h3>
          {descItems.length > 1 ? (
            <ul className="mt-2 space-y-1">
              {descItems.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-sm text-gray-500">
                  <span className="text-gold flex-shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm mt-1">{service.description}</p>
          )}
          {durationLabel && (
            <p className="text-xs text-gray-400 mt-2">{durationLabel}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xl md:text-2xl font-heading font-bold text-gold whitespace-nowrap">
            Rs. {service.price.toLocaleString()}
            {service.price_max ? ` – ${service.price_max.toLocaleString()}` : ""}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Search + Filter Tabs */}
      <div className="sticky top-16 z-30 bg-cream border-b border-gold/20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 pt-3">
          {/* Search bar */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services…"
              className="w-full pl-9 pr-9 py-2.5 rounded-full border border-gold/30 bg-white text-charcoal text-sm placeholder-gray-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-charcoal transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
          {/* Category tabs — hidden while searching */}
          {!isSearching && (
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-3">
              {TABS.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setActive(tab.label)}
                  className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                    active === tab.label
                      ? "bg-gold text-white shadow-md"
                      : "bg-white text-charcoal border border-gold/30 hover:border-gold hover:text-gold"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Services Grid */}
      <section className="py-12 px-4 bg-cream">
        <div className="max-w-6xl mx-auto">
          {isSearching && searchResults.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No services found for &ldquo;{query}&rdquo;</p>
              <button onClick={() => setQuery("")} className="mt-4 text-gold underline text-sm">Clear search</button>
            </div>
          ) : (
            filteredCategories.map((category) => {
              const items = visibleServices.filter((s) => s.category === category);
              if (!items.length) return null;
              return (
                <div key={category} className="mb-14 last:mb-0">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-1 h-8 rounded-full bg-gold" />
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal">
                      {category}
                    </h2>
                    <div className="flex-1 h-px ml-2 bg-gold/20" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((service) => <ServiceCard key={service.id} service={service} />)}
                  </div>
                </div>
              );
            })
          )}

          <div className="text-center mt-12">
            <Link href="/book" className="btn-gold text-lg px-10 py-4">
              Book an Appointment
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
