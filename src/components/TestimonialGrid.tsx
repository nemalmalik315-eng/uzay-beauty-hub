"use client";

import { useState } from "react";

const reviews = [
  {
    name: "Aamina Ahmad",
    text: "I had such a lovely experience at this salon during my stay in Lahore! I visited three times and was really impressed.",
    service: "Multiple Visits",
  },
  {
    name: "Asvir Naveed",
    text: "Had a great experience at Uzay Beauty Hub. This is a hidden gem in Nashimeen-e-Iqbal Phase 2. A highly recommended place.",
    service: "Salon Services",
  },
  {
    name: "Aina",
    text: "Very good experience at the salon. Haircut, facial, and soft glam makeup were done nicely. My mother and I were happy. The owner guided us well.",
    service: "Haircut, Facial & Makeup",
  },
  {
    name: "Nimra Azam",
    text: "I always have great experiences at this salon. So much satisfying results and the staff is very friendly, specially Sara and Iqra. Great experience and budget friendly!",
    service: "Regular Client",
  },
  {
    name: "Iman Zaheer",
    text: "I have been visiting here for 4 years and every time I have a great experience whether it is body waxing, haircut or other services.",
    service: "4-Year Client",
  },
  {
    name: "Azka Awan",
    text: "Easy appointments, welcoming staff, and talented employees! I was thrilled with my hydra facial and mani pedi services.",
    service: "Hydra Facial & Mani Pedi",
  },
  {
    name: "Yumna Asim",
    text: "I got my rukhsati makeup done from here and it was a beautiful experience. The staff was so good and the owner was so polite. I highly recommend it!",
    service: "Bridal Makeup",
  },
  {
    name: "Najeeba Zulfiqar",
    text: "Got my hair and makeup done here. Very affordable but good results. The staff is very humble too.",
    service: "Hair & Makeup",
  },
];

export default function TestimonialGrid() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, 4);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visible.map((review, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="flex text-yellow-400 text-sm mb-3">
              {"★★★★★"}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed flex-1">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="font-semibold text-charcoal text-sm">
                {review.name}
              </p>
              <p className="text-xs text-gold">{review.service}</p>
            </div>
          </div>
        ))}
      </div>
      {!showAll && (
        <div className="text-center mt-8">
          <button
            onClick={() => setShowAll(true)}
            className="text-gold hover:text-gold-dark font-medium transition-colors inline-flex items-center gap-1"
          >
            Show More Reviews
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
