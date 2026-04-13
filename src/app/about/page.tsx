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
                icon: "🎯",
              },
              {
                title: "Quality First",
                desc: "We use only premium, salon-grade products and stay updated with the latest techniques and trends.",
                icon: "⭐",
              },
              {
                title: "Customer Care",
                desc: "Your satisfaction is our priority. We listen, understand, and deliver exactly what you envision.",
                icon: "💝",
              },
              {
                title: "Hygiene & Safety",
                desc: "We maintain the highest standards of cleanliness and sanitation for your safety and comfort.",
                icon: "🛡️",
              },
            ].map((item) => (
              <div key={item.title} className="card">
                <span className="text-3xl mb-3 block">{item.icon}</span>
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
