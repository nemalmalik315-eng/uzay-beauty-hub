import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import getDb from "@/lib/db";

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
}

export const dynamic = "force-dynamic";

export default function ServicesPage() {
  const db = getDb();
  const services = db
    .prepare("SELECT * FROM services WHERE active = 1 ORDER BY category, id")
    .all() as Service[];

  const categories = [...new Set(services.map((s) => s.category))];

  // No emoji icons — clean professional look

  return (
    <>
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-16 px-4 bg-charcoal-dark">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold font-medium tracking-wider uppercase text-sm mb-3">
            Our Menu
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            Services & Pricing
          </h1>
          <p className="text-gray-300 text-lg">
            Premium beauty services tailored to perfection
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 bg-cream">
        <div className="max-w-6xl mx-auto">
          {categories.map((category) => (
            <div key={category} className="mb-16 last:mb-0">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-1 h-8 bg-gold rounded-full" />
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal">
                  {category}
                </h2>
                <div className="flex-1 h-px bg-gold/20 ml-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services
                  .filter((s) => s.category === category)
                  .map((service) => (
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
                          Rs. {service.price}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <div className="text-center mt-12">
            <Link href="/book" className="btn-gold text-lg px-10 py-4">
              Book an Appointment
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
