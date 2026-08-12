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
  description: string;
}

const CATEGORY_ORDER = [
  "Hair",
  "Hair Color",
  "Hair Treatment",
  "Facials",
  "Cleansing",
  "Polisher",
  "Body Waxing",
  "Face Waxing",
  "Manicure & Pedicure",
  "Makeup",
  "Kids",
  "Assistant Bridal",
  "Signature Bridal",
  "Bridal",
  "Azaadi Deals",
];

const TABS = [
  { label: "All", categories: null },
  { label: "🇵🇰 Deals", categories: ["Azaadi Deals"] },
  { label: "Hair", categories: ["Hair", "Hair Color", "Hair Treatment"] },
  { label: "Waxing", categories: ["Body Waxing", "Face Waxing"] },
  { label: "Skin & Facials", categories: ["Facials", "Cleansing"] },
  { label: "Nails", categories: ["Manicure & Pedicure", "Polisher"] },
  { label: "Bridal", categories: ["Assistant Bridal", "Signature Bridal"] },
  { label: "Makeup & Kids", categories: ["Makeup", "Kids"] },
];

export default function ServicesFilter({ services }: { services: Service[] }) {
  const [active, setActive] = useState("All");

  const filteredCategories = (() => {
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

  const visibleServices = filteredCategories.flatMap((cat) =>
    services.filter((s) => s.category === cat)
  );

  return (
    <>
      {/* Filter Tabs */}
      <div className="sticky top-16 z-30 bg-cream border-b border-gold/20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActive(tab.label)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                  tab.label === "🇵🇰 Deals"
                    ? active === tab.label
                      ? "text-white shadow-lg ring-2 ring-white/60 ring-offset-1"
                      : "text-white opacity-90 hover:opacity-100"
                    : active === tab.label
                    ? "bg-gold text-white shadow-md"
                    : "bg-white text-charcoal border border-gold/30 hover:border-gold hover:text-gold"
                }`}
                style={tab.label === "🇵🇰 Deals" ? { backgroundColor: "#015f2a" } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <section className="py-12 px-4 bg-cream">
        <div className="max-w-6xl mx-auto">
          {filteredCategories.map((category) => {
            const items = visibleServices.filter((s) => s.category === category);
            if (!items.length) return null;
            return (
              <div key={category} className="mb-14 last:mb-0">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-1 h-8 rounded-full" style={{ backgroundColor: category === "Azaadi Deals" ? "#015f2a" : undefined, background: category !== "Azaadi Deals" ? "var(--color-gold, #b8973a)" : undefined }} />
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal flex items-center gap-2">
                    {category === "Azaadi Deals" && <span>🇵🇰</span>}
                    {category === "Azaadi Deals" ? "Azaadi Deals" : category}
                    {category === "Azaadi Deals" && <span className="text-sm font-normal text-white px-2 py-0.5 rounded-full ml-1" style={{ backgroundColor: "#015f2a" }}>Till 15 Aug</span>}
                  </h2>
                  <div className="flex-1 h-px ml-2" style={{ backgroundColor: category === "Azaadi Deals" ? "#015f2a33" : undefined, background: category !== "Azaadi Deals" ? "rgba(184,151,58,0.2)" : undefined }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((service) => {
                    const isAzaadi = category === "Azaadi Deals";
                    const descItems = service.description?.split(" · ") ?? [];
                    return (
                      <div
                        key={service.id}
                        className="card flex items-start justify-between gap-4 group hover:border-gold/40 hover:shadow-md transition-all duration-200"
                        style={isAzaadi ? { borderLeft: "3px solid #015f2a" } : undefined}
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-charcoal text-lg group-hover:text-gold transition-colors">
                            {service.name}
                          </h3>
                          {isAzaadi && descItems.length > 1 ? (
                            <ul className="mt-2 space-y-1">
                              {descItems.map((item) => (
                                <li key={item} className="flex items-start gap-1.5 text-sm text-gray-500">
                                  <span className="flex-shrink-0 mt-0.5" style={{ color: "#015f2a" }}>✓</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                          )}
                          {!isAzaadi && (
                            <p className="text-xs text-gray-400 mt-2">{service.duration} min</p>
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
                  })}
                </div>
              </div>
            );
          })}

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
