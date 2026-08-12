import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServicesFilter from "@/components/ServicesFilter";
import getDb from "@/lib/db";

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  price_max?: number;
  duration: number;
  description: string;
}

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const db = getDb();
  const { rows } = await db.execute("SELECT * FROM services WHERE active = 1 ORDER BY category, id");
  const services: Service[] = rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    category: r.category as string,
    price: r.price as number,
    price_max: r.price_max ? (r.price_max as number) : undefined,
    duration: r.duration as number,
    description: r.description as string,
  }));

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

      <ServicesFilter services={services} />

      <Footer />
    </>
  );
}
