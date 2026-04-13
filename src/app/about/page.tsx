import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <section className="pt-28 pb-16 px-4 bg-charcoal-dark">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold font-medium tracking-wider uppercase text-sm mb-3">
            Our Story
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            About Uzay Beauty Hub
          </h1>
        </div>
      </section>

      <section className="py-16 px-4 bg-cream">
        <div className="max-w-4xl mx-auto">
          <div className="card mb-12">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-shrink-0">
                <Image
                  src="/logo.jpeg"
                  alt="Uzay Beauty Hub"
                  width={200}
                  height={200}
                  className="rounded-2xl shadow-lg"
                />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-charcoal mb-4">
                  Where Beauty Becomes Art
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Uzay Beauty Hub was born from a simple belief: every person
                  deserves to feel confident, beautiful, and pampered. We
                  combine traditional beauty wisdom with modern techniques to
                  deliver results that exceed expectations.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Our team of skilled professionals is dedicated to providing
                  personalized services in a warm, welcoming environment. From
                  everyday grooming to bridal transformations, we put our heart
                  into every service.
                </p>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Our Mission",
                desc: "To make premium beauty services accessible and to help every client discover their best self.",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                ),
              },
              {
                title: "Quality First",
                desc: "We use only premium, salon-grade products and stay updated with the latest techniques and trends.",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                ),
              },
              {
                title: "Customer Care",
                desc: "Your satisfaction is our priority. We listen, understand, and deliver exactly what you envision.",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                ),
              },
              {
                title: "Hygiene & Safety",
                desc: "We maintain the highest standards of cleanliness and sanitation for your safety and comfort.",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                ),
              },
            ].map((item) => (
              <div key={item.title} className="card">
                <div className="w-12 h-12 bg-gold-light rounded-full flex items-center justify-center text-gold mb-4">{item.icon}</div>
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/book" className="btn-gold text-lg px-10 py-4">
              Book Your Visit
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
