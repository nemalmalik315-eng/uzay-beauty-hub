import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const facialDeals = [
  {
    label: "Azaadi Deal 1",
    services: ["Cleansing", "Polisher", "Mask", "Hand & Feet Polisher"],
    price: 800,
  },
  {
    label: "Azaadi Deal 2",
    services: ["Derma Whitening Facial", "Whitening Manicure & Pedicure", "Shoulder Massage", "Upper Lips Threading"],
    price: 3000,
  },
  {
    label: "Azaadi Deal 3",
    services: ["Whitening IceCool Facial", "Whitening Polisher", "Whitening Manicure & Pedicure", "Shoulder Massage", "Straight Trimming"],
    price: 3500,
  },
  {
    label: "Azaadi Deal 4",
    services: ["Glowing Facial Gold / Pure Skin", "Whitening Manicure & Pedicure", "Shoulder Massage", "Half Arm Wax"],
    price: 4500,
  },
  {
    label: "Azaadi Deal 5",
    services: ["Premium Janssen Facial", "Premium Jelly Manicure & Pedicure", "Shoulder Massage", "Half Arm Wax", "Half Leg Wax"],
    price: 8000,
  },
];

export default function DealsPage() {
  return (
    <>
      <Navbar />
      <main
        className="min-h-screen pt-20"
        style={{ background: "linear-gradient(160deg, #012f16 0%, #014d22 45%, #01602a 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">

          {/* Header */}
          <div className="text-center mb-10 md:mb-14">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-3xl">🇵🇰</span>
              <span className="text-white/50 text-xs uppercase tracking-[0.3em]">Independence Day Special</span>
              <span className="text-3xl">🇵🇰</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white leading-tight mb-1">
              Azaadi <span className="text-gold">Offer</span>
            </h1>
            <p className="text-white/70 font-heading text-lg md:text-xl mb-4">Uzay Beauty Hub</p>
            <div className="w-20 h-0.5 gold-gradient mx-auto mb-5 rounded-full" />
            <p className="text-white/80 text-sm max-w-md mx-auto leading-relaxed mb-4">
              Here is an Azaadi gift from us to you!<br />
              We work on <span className="text-white font-semibold">Bookings Only</span>
            </p>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2.5">
              <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span className="text-white text-sm font-semibold">Avail deal till 15 August · 11:30am – 6:00pm</span>
            </div>
          </div>

          {/* Facial Deals */}
          <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-5">✦ Facial Packages ✦</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {facialDeals.map((deal) => (
              <div
                key={deal.label}
                className="bg-white/8 border border-white/15 rounded-2xl p-5 flex flex-col backdrop-blur-sm hover:bg-white/12 transition-colors"
              >
                <div className="mb-3">
                  <span className="inline-block bg-gold/20 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    {deal.label}
                  </span>
                </div>
                <ul className="flex-1 space-y-1.5 mb-4">
                  {deal.services.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-white/85 text-sm">
                      <span className="text-gold mt-0.5 flex-shrink-0">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-white/15 pt-3 mt-auto flex items-center justify-between">
                  <span className="text-2xl font-heading font-bold text-gold">Rs. {deal.price.toLocaleString()}</span>
                  <Link
                    href="/book"
                    className="text-xs font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Book →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Body Deals */}
          <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-5">✦ Body Treatments ✦</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
            {[
              { label: "Azaadi Full Body Wax", before: 5000, now: 3500 },
              { label: "Azaadi Full Body Massage", before: 5000, now: 3500 },
            ].map((deal) => (
              <div
                key={deal.label}
                className="bg-white/8 border border-white/15 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/12 transition-colors"
              >
                <h4 className="font-heading font-semibold text-white text-lg mb-4 text-center">{deal.label}</h4>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-0.5">Before</p>
                    <p className="text-lg font-medium text-white/40 line-through">Rs. {deal.before.toLocaleString()}</p>
                  </div>
                  <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <div className="text-center">
                    <p className="text-xs text-gold uppercase tracking-wider mb-0.5">Now</p>
                    <p className="text-2xl font-heading font-bold text-gold">Rs. {deal.now.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-center">
                  <Link href="/book" className="text-xs font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-full transition-colors">
                    Book →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Hair Deal */}
          <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-5">✦ Hair Package ✦</p>
          <div className="max-w-sm mx-auto mb-12">
            <div className="bg-white/8 border border-white/15 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/12 transition-colors text-center">
              <span className="inline-block bg-gold/20 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                Azaadi Hair Deal
              </span>
              <ul className="space-y-1.5 mb-2 text-left max-w-[200px] mx-auto">
                {["Hair Wash", "Protein Mask", "Haircut", "Blow Dry"].map((s) => (
                  <li key={s} className="flex items-start gap-2 text-white/85 text-sm">
                    <span className="text-gold mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
              <p className="text-white/50 text-xs mt-2 mb-4">For shoulder to medium hair length</p>
              <div className="border-t border-white/15 pt-3 flex items-center justify-between">
                <span className="text-2xl font-heading font-bold text-gold">Rs. 3,000</span>
                <Link href="/book" className="text-xs font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-full transition-colors">
                  Book →
                </Link>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link href="/book" className="btn-gold text-base px-8 py-3.5 rounded-full">
              Book Your Azaadi Deal
            </Link>
            <p className="text-white/40 text-xs mt-3">Bookings only · Limited slots available</p>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
