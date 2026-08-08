"use client";

import { useState } from "react";
import Link from "next/link";

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
}

const TABS = [
  { label: "All", categories: null },
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
    return allowedCats
      ? allCategories.filter((c) => allowedCats.includes(c))
      : allCategories;
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
                  active === tab.label
                    ? "bg-gold text-white shadow-md"
                    : "bg-white text-charcoal border border-gold/30 hover:border-gold hover:text-gold"
                }`}
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
                  <div className="w-1 h-8 bg-gold rounded-full" />
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal">
                    {category}
                  </h2>
                  <div className="flex-1 h-px bg-gold/20 ml-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((service) => (
                    <div
                      key={service.id}
                      className="card flex items-start justify-between gap-4 group"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-charcoal text-lg group-hover:text-gold transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {service.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {service.duration} min
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-2xl font-heading font-bold text-gold">
                          Rs. {service.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
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
