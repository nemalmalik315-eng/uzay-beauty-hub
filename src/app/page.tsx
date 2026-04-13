import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import TestimonialGrid from "@/components/TestimonialGrid";

const categories = [
  {
    name: "Hair Care",
    desc: "Cuts, coloring, keratin, blowouts & more",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>,
  },
  {
    name: "Skin Care",
    desc: "Herbal, whitening, hydra & Korean facials",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
  },
  {
    name: "Nail Art",
    desc: "Manicure, pedicure, gel & acrylic nails",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3.026a3.12 3.12 0 01-.475 0H5.25a1.575 1.575 0 100 3.15h.175a3.13 3.13 0 01.475 0v3.674a1.575 1.575 0 103.15 0v-3.674a3.13 3.13 0 01.475 0h.175a1.575 1.575 0 100-3.15h-.175a3.12 3.12 0 01-.475 0V4.575zm7.5 0a1.575 1.575 0 10-3.15 0v3.026a3.12 3.12 0 01-.475 0h-.175a1.575 1.575 0 100 3.15h.175a3.13 3.13 0 01.475 0v3.674a1.575 1.575 0 103.15 0v-3.674a3.13 3.13 0 01.475 0h.175a1.575 1.575 0 100-3.15h-.175a3.12 3.12 0 01-.475 0V4.575z" /></svg>,
  },
  {
    name: "Makeup",
    desc: "Party, bridal, engagement & natural looks",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>,
  },
  {
    name: "Waxing",
    desc: "Full body, face, arms & legs waxing",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
  },
  {
    name: "Bridal",
    desc: "Complete bridal & mehndi packages",
    icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>,
  },
];

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-charcoal-dark overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal-dark via-charcoal to-charcoal-dark opacity-95" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="mb-8 flex justify-center hero-animate hero-animate-1">
            <Image
              src="/logo.jpeg"
              alt="Uzay Beauty Hub"
              width={140}
              height={140}
              className="rounded-full shadow-2xl border-4 border-gold/30"
            />
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 leading-tight hero-animate hero-animate-2">
            Where{" "}
            <span className="text-gold">Elegance</span>
            <br />
            Meets Expertise
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed hero-animate hero-animate-3">
            Experience premium beauty services crafted with care and precision.
            Your journey to radiance begins here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center hero-animate hero-animate-4">
            <Link href="/book" className="btn-gold text-lg px-10 py-4">
              Book Your Appointment
            </Link>
            <Link href="/services" className="btn-outline border-white text-white hover:bg-white hover:text-charcoal text-lg px-10 py-4">
              View Services
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 px-4 bg-cream">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <p className="text-gold font-medium tracking-wider uppercase text-sm mb-3">
                What We Offer
              </p>
              <h2 className="section-heading">Our Services</h2>
              <div className="w-20 h-1 gold-gradient mx-auto mt-4 rounded-full" />
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll staggerChildren stagger={100} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href="/services"
                className="card group hover:border-gold border-2 border-transparent text-center"
              >
                <div className="w-14 h-14 bg-gold-light rounded-full flex items-center justify-center mx-auto mb-4 text-gold group-hover:bg-gold group-hover:text-white transition-colors">
                  {cat.icon}
                </div>
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">
                  {cat.name}
                </h3>
                <p className="text-gray-500 text-sm">{cat.desc}</p>
              </Link>
            ))}
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={200}>
            <div className="text-center mt-12">
              <Link href="/services" className="btn-gold">
                View All Services & Prices
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <p className="text-gold font-medium tracking-wider uppercase text-sm mb-3">
                Why Us
              </p>
              <h2 className="section-heading">The Uzay Difference</h2>
              <div className="w-20 h-1 gold-gradient mx-auto mt-4 rounded-full" />
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll staggerChildren stagger={150} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Expert Team",
                desc: "Our skilled professionals bring years of experience and passion to every service.",
                stat: "10+",
                statLabel: "Years Experience",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
              },
              {
                title: "Premium Products",
                desc: "We use only the highest quality, salon-grade products for the best results.",
                stat: "158+",
                statLabel: "Happy Clients",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
              },
              {
                title: "Relaxing Atmosphere",
                desc: "Step into a world of calm and luxury designed for your ultimate comfort.",
                stat: "5.0",
                statLabel: "Google Rating",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.title} className="bg-cream rounded-xl p-8 text-center border border-gold/10 hover:border-gold/30 transition-colors">
                <div className="w-16 h-16 bg-gold-light rounded-full flex items-center justify-center mx-auto mb-5 text-gold">
                  {item.icon}
                </div>
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-5">{item.desc}</p>
                <div className="pt-4 border-t border-gold/10">
                  <p className="text-2xl font-heading font-bold text-gold">{item.stat}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">{item.statLabel}</p>
                </div>
              </div>
            ))}
          </AnimateOnScroll>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 px-4 bg-cream">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-12">
              <p className="text-gold font-medium tracking-wider uppercase text-sm mb-3">
                Our Space
              </p>
              <h2 className="section-heading">Step Inside Uzay Beauty Hub</h2>
              <div className="w-20 h-1 gold-gradient mx-auto mt-4 rounded-full" />
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-in" duration={800}>
          <div className="columns-2 md:columns-3 gap-3 md:gap-4 space-y-3 md:space-y-4">
            {[
              { src: "/gallery/bridal-makeup-1.png", alt: "Bridal Glam Makeup" },
              { src: "/gallery/2025-11-08.jpg", alt: "Salon Interior" },
              { src: "/gallery/mehndi-1.png", alt: "Mehndi Art" },
              { src: "/gallery/bridal-hairstyle-2.png", alt: "Bridal Braid with Jewelry" },
              { src: "/gallery/jelly-mani-pedi-2.png", alt: "Jelly Mani Pedi Results" },
              { src: "/gallery/bridal-makeup-2.png", alt: "Party Makeup Look" },
              { src: "/gallery/2025-11-08-1.jpg", alt: "Elegant Gold Decor" },
              { src: "/gallery/bridal-hairstyle-1.png", alt: "Bridal Hair Styling" },
              { src: "/gallery/jelly-mani-pedi-1.png", alt: "Jelly Manicure & Pedicure" },
              { src: "/gallery/2025-11-08-2.jpg", alt: "Pedicure Station" },
              { src: "/gallery/2025-12-13.jpg", alt: "Uzay Beauty Hub" },
              { src: "/gallery/2025-12-13-1.jpg", alt: "Garden Entrance" },
            ].map((img, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-xl group break-inside-avoid"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={500}
                  height={600}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <p className="text-white text-sm font-medium p-4">{img.alt}</p>
                </div>
              </div>
            ))}
          </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={200}>
          <div className="text-center mt-10">
            <a
              href="https://www.instagram.com/uzay_beautyhub/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-charcoal hover:text-gold font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Follow us @uzay_beautyhub for more
            </a>
          </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-cream-dark">
        <div className="max-w-7xl mx-auto">
          <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-6">
            <p className="text-gold font-medium tracking-wider uppercase text-sm mb-3">
              Client Love
            </p>
            <h2 className="section-heading">What Our Clients Say</h2>
            <div className="w-20 h-1 gold-gradient mx-auto mt-4 rounded-full" />
          </div>

          {/* Google Rating Badge */}
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="flex items-center gap-1 bg-white rounded-full px-5 py-2 shadow-sm border border-gray-100">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div className="flex text-yellow-400">
                {"★★★★★".split("").map((s, i) => (
                  <span key={i} className="text-lg">{s}</span>
                ))}
              </div>
              <span className="font-bold text-charcoal ml-1">5.0</span>
              <span className="text-gray-400 text-sm ml-1">• 158 reviews</span>
            </div>
          </div>
          </AnimateOnScroll>

          <TestimonialGrid />
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* CTA */}
      <section className="py-20 px-4 bg-charcoal-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
        </div>
        <AnimateOnScroll animation="fade-up" className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6">
            Ready to <span className="text-gold">Transform</span> Your Look?
          </h2>
          <p className="text-gray-300 text-lg mb-10">
            Book your appointment today and let our experts take care of the rest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book" className="btn-gold text-lg px-10 py-4">
              Book Online
            </Link>
            <a
              href="https://wa.me/923344198243?text=Hi!%20I%20would%20like%20to%20book%20an%20appointment"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline border-green-400 text-green-400 hover:bg-green-500 hover:border-green-500 hover:text-white text-lg px-10 py-4 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Us
            </a>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer />
    </>
  );
}
