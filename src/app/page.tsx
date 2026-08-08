import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import TestimonialGrid from "@/components/TestimonialGrid";

const categories = [
  {
    name: "Hair",
    desc: "Cuts, colour, keratin & blowouts",
    img: "/gallery/bridal-hair-mehndi-2.png",
  },
  {
    name: "Skin & Facials",
    desc: "Herbal, whitening, hydra & Korean",
    img: "/gallery/soft-glam-green-bridal.png",
  },
  {
    name: "Nails",
    desc: "Manicure, pedicure & gel nails",
    img: "/gallery/jelly-mani-pedi-1.png",
  },
  {
    name: "Makeup",
    desc: "Party, bridal & engagement looks",
    img: "/gallery/bridal-makeup-1.png",
  },
  {
    name: "Waxing",
    desc: "Full body, arms, legs & face",
    img: "/gallery/party-makeup-pink.png",
  },
  {
    name: "Bridal",
    desc: "Complete bridal & mehndi packages",
    img: "/gallery/bridal-maroon-1.png",
  },
];

const galleryImages = [
  { src: "/gallery/bridal-makeup-1.png", alt: "Bridal Glam" },
  { src: "/gallery/bridal-red-portrait.png", alt: "Bridal Portrait" },
  { src: "/gallery/soft-glam-green-bridal.png", alt: "Soft Glam" },
  { src: "/gallery/bridal-maroon-1.png", alt: "Bridal Look" },
  { src: "/gallery/jelly-mani-pedi-1.png", alt: "Jelly Mani Pedi" },
  { src: "/gallery/bridal-braid-gold-1.png", alt: "Bridal Braid" },
  { src: "/gallery/party-makeup-pink.png", alt: "Party Makeup" },
  { src: "/gallery/bridal-gold-glam.png", alt: "Gold Glam" },
  { src: "/gallery/bridal-braid-mehndi-1.png", alt: "Bridal Braid Mehndi" },
  { src: "/gallery/mehndi-1.png", alt: "Mehndi Art" },
  { src: "/gallery/jelly-mani-pedi-2.png", alt: "Mani Pedi" },
  { src: "/gallery/bridal-makeup-2.png", alt: "Bridal Makeup" },
];

export default function Home() {
  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative h-[88vh] md:min-h-screen flex items-end justify-center overflow-hidden">
        {/* Background photo */}
        <Image
          src="/gallery/hero-salon.jpg"
          alt="Uzay Beauty Hub bridal makeup"
          fill
          className="object-cover object-[center_12%]"
          priority
        />
        {/* Gradient: dark top for logo, light mid, dark bottom for text */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/10 to-black/80" />

        {/* Logo */}
        <div className="absolute top-20 sm:top-24 left-0 right-0 flex justify-center z-10">
          <div className="bg-white rounded-2xl px-5 py-3 shadow-xl">
            <Image
              src="/logo.jpeg"
              alt="Uzay Beauty Hub"
              width={130}
              height={85}
              className="object-contain"
            />
          </div>
        </div>

        <div className="relative z-10 text-center px-5 pb-14 md:pb-24 w-full max-w-3xl mx-auto">
          <p className="text-gold text-xs tracking-[0.25em] uppercase font-medium mb-4 hero-animate hero-animate-1">
            Lahore&apos;s Premier Beauty Salon
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-8 leading-tight hero-animate hero-animate-2">
            Where <span className="text-gold">Elegance</span>
            <br />Meets Expertise
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 justify-center hero-animate hero-animate-3">
            <Link href="/book" className="btn-gold text-base px-8 py-3.5 rounded-full">
              Book Appointment
            </Link>
            <Link href="/services" className="border border-white/60 text-white px-8 py-3.5 rounded-full text-base font-medium hover:bg-white/10 transition-colors">
              View Menu
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-charcoal-dark border-t border-gold/10">
        <div className="max-w-3xl mx-auto px-4 py-5 grid grid-cols-3 divide-x divide-gold/20">
          {[
            { stat: "158+", label: "Happy Clients" },
            { stat: "5.0 ★", label: "Google Rating" },
            { stat: "10+", label: "Years Experience" },
          ].map((item) => (
            <div key={item.label} className="text-center px-3">
              <p className="text-gold font-heading font-bold text-xl md:text-2xl">{item.stat}</p>
              <p className="text-gray-400 text-xs mt-0.5 uppercase tracking-wide">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Service Categories ── */}
      <section className="py-12 md:py-20 px-4 bg-cream">
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-8 md:mb-12">
              <p className="text-gold font-medium tracking-wider uppercase text-xs mb-2">What We Offer</p>
              <h2 className="section-heading">Our Services</h2>
              <div className="w-16 h-0.5 gold-gradient mx-auto mt-3 rounded-full" />
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {categories.map((cat, i) => (
              <AnimateOnScroll key={cat.name} animation="fade-up" delay={i * 60}>
                <Link href="/services" className="group relative overflow-hidden rounded-xl aspect-[3/4] block">
                  <Image
                    src={cat.img}
                    alt={cat.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/90 via-charcoal-dark/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                    <h3 className="text-white font-heading font-semibold text-base md:text-lg leading-tight">
                      {cat.name}
                    </h3>
                    <p className="text-gray-300 text-xs mt-0.5 hidden md:block">{cat.desc}</p>
                  </div>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>

          <AnimateOnScroll animation="fade-up" delay={200}>
            <div className="text-center mt-8">
              <Link href="/services" className="btn-gold px-8 py-3 rounded-full">
                View All Services & Prices
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="py-12 md:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-8 md:mb-12">
              <p className="text-gold font-medium tracking-wider uppercase text-xs mb-2">Our Work</p>
              <h2 className="section-heading">Results That Speak</h2>
              <div className="w-16 h-0.5 gold-gradient mx-auto mt-3 rounded-full" />
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-in" duration={800}>
            <div className="columns-2 md:columns-3 gap-2 md:gap-4 space-y-2 md:space-y-4">
              {galleryImages.map((img, i) => (
                <div key={i} className="relative overflow-hidden rounded-lg break-inside-avoid group">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={400}
                    height={500}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <p className="text-white text-xs font-medium p-3">{img.alt}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={200}>
            <div className="text-center mt-8">
              <a
                href="https://www.instagram.com/uzay_beautyhub/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white px-6 py-3 rounded-full font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                Follow @uzay_beautyhub
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-12 md:py-20 px-4 bg-charcoal-dark">
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-8 md:mb-12">
              <p className="text-gold font-medium tracking-wider uppercase text-xs mb-2">Why Us</p>
              <h2 className="text-3xl md:text-4xl font-heading font-semibold text-white mb-2">The Uzay Difference</h2>
              <div className="w-16 h-0.5 gold-gradient mx-auto mt-3 rounded-full" />
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll staggerChildren stagger={150} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                title: "Expert Team",
                desc: "Skilled professionals with years of experience and passion for beauty.",
                icon: (
                  <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
                ),
              },
              {
                title: "Premium Products",
                desc: "Only the highest quality, salon-grade products for the best results.",
                icon: (
                  <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>
                ),
              },
              {
                title: "Luxurious Atmosphere",
                desc: "Step into a world of calm and luxury designed for your comfort.",
                icon: (
                  <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                ),
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 bg-white/5 border border-white/8 rounded-2xl p-5 md:flex-col md:p-6">
                <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-1.5">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-12 md:py-20 px-4 bg-cream">
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-6 md:mb-10">
              <p className="text-gold font-medium tracking-wider uppercase text-xs mb-2">Client Love</p>
              <h2 className="section-heading">What Our Clients Say</h2>
              <div className="w-16 h-0.5 gold-gradient mx-auto mt-3 rounded-full" />
            </div>
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-5 py-2 shadow-sm border border-gray-100">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div className="flex text-yellow-400 text-base">★★★★★</div>
                <span className="font-bold text-charcoal text-sm">5.0</span>
                <span className="text-gray-400 text-xs">• 158 reviews</span>
              </div>
            </div>
          </AnimateOnScroll>
          <TestimonialGrid />
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQ />

      {/* ── CTA ── */}
      <section className="py-14 md:py-24 px-4 bg-charcoal-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold rounded-full blur-3xl" />
        </div>
        <AnimateOnScroll animation="fade-up" className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">
            Ready to <span className="text-gold">Transform</span> Your Look?
          </h2>
          <p className="text-gray-400 text-base mb-8">
            Book your appointment today and let our experts take care of the rest.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/book" className="btn-gold text-base px-8 py-4 rounded-full">
              Book Online
            </Link>
            <a
              href="https://wa.me/923344198243?text=Hi!%20I%20would%20like%20to%20book%20an%20appointment"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-full text-base font-medium hover:bg-[#20b958] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Us
            </a>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── Sticky Mobile Booking Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-charcoal-dark/95 backdrop-blur border-t border-gold/20 px-4 py-3 flex gap-2 safe-bottom">
        <Link href="/book" className="flex-1 bg-gold text-white text-center py-3 rounded-full font-medium text-sm">
          Book Appointment
        </Link>
        <a
          href="https://wa.me/923344198243?text=Hi!%20I%20would%20like%20to%20book%20an%20appointment"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-[#25D366] text-white text-center py-3 rounded-full font-medium text-sm flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </a>
      </div>

      {/* Push content above sticky bar on mobile */}
      <div className="h-16 md:hidden" />

      <Footer />
    </>
  );
}
