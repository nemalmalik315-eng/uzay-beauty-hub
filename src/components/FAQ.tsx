"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Do I need to book an appointment or do you accept walk-ins?",
    a: "We accept both! However, we highly recommend booking an appointment to avoid wait times. You can book online through our website or via WhatsApp at 0334 4198243.",
  },
  {
    q: "What are your opening hours?",
    a: "We are open 7 days a week. Monday, Friday & Sunday: 11 AM - 7 PM. Tuesday, Wednesday, Thursday & Saturday: 11 AM - 7:30 PM.",
  },
  {
    q: "Where are you located?",
    a: "We are located at 112B, Block B, Nasheman-e-Iqbal Phase 2, Lahore, 54000. Easy to find and accessible from the main road.",
  },
  {
    q: "Do you offer bridal packages?",
    a: "Yes! We offer complete bridal packages including makeup, hair styling, mehndi, and more. We recommend booking bridal appointments well in advance. Contact us on WhatsApp to discuss your requirements.",
  },
  {
    q: "What types of facials do you offer?",
    a: "We offer a wide range of facials starting from Rs. 1,500 — including Herbal, Whitening, Ultra Whitening, Gold, Korean, Mini Hydra, Advanced Hydra, and Janssen facials. Each comes with different treatments tailored to your skin needs.",
  },
  {
    q: "Do you have services for kids?",
    a: "Yes! We have a dedicated Kids section for children under 10 years — including baby haircuts, kids styling, manicure & pedicure, and kids makeup packages.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept cash and all major payment methods. Please ask at the salon for current payment options.",
  },
  {
    q: "Do you offer beauty training courses?",
    a: "Yes! Uzay Beauty Hub & Institute also offers professional beauty training courses. Contact us on WhatsApp for details about our training programs.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold font-medium tracking-wider uppercase text-sm mb-3">
            Got Questions?
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
            Frequently Asked Questions
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-gold to-gold-dark mx-auto mt-4 rounded-full" />
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-stone-200 rounded-lg overflow-hidden hover:border-gold/30 transition-colors"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-semibold text-charcoal pr-4">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gold flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
