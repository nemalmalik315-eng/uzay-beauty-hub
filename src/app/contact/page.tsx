import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <section className="pt-28 pb-16 px-4 bg-charcoal-dark">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold font-medium tracking-wider uppercase text-sm mb-3">
            Get in Touch
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            Contact Us
          </h1>
          <p className="text-gray-300 text-lg">
            We&apos;d love to hear from you
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <span className="text-gold">📍</span> Visit Us
                </h3>
                <p className="text-gray-600">
                  Uzay Beauty Hub
                  <br />
                  112B, Block B, Nasheman-e-Iqbal Phase 2
                  <br />
                  Lahore, 54000
                </p>
              </div>

              <div className="card">
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <span className="text-gold">📞</span> Call Us
                </h3>
                <p className="text-gray-600">
                  <a href="tel:+923344198243" className="hover:text-gold transition-colors">
                    0334 4198243
                  </a>
                </p>
              </div>

              <div className="card">
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <span className="text-gold">💬</span> WhatsApp
                </h3>
                <a
                  href="https://wa.me/923344198243?text=Hi!%20I%20have%20a%20question"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                >
                  Chat with us on WhatsApp
                </a>
              </div>

              <div className="card">
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <span className="text-gold">🕐</span> Business Hours
                </h3>
                <div className="text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Monday</span>
                    <span className="font-medium">11:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tuesday</span>
                    <span className="font-medium">11:00 AM - 7:30 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wednesday</span>
                    <span className="font-medium">11:00 AM - 7:30 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thursday</span>
                    <span className="font-medium">11:00 AM - 7:30 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Friday</span>
                    <span className="font-medium">11:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-medium">11:00 AM - 7:30 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-medium">11:00 AM - 7:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="card flex flex-col">
              <h3 className="font-heading text-xl font-semibold text-charcoal mb-4">
                Find Us on the Map
              </h3>
              <div className="flex-1 rounded-lg overflow-hidden min-h-[400px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3402.5!2d74.2!3d31.4!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTEyQiwgQmxvY2sgQiwgTmFzaGVtYW4tZS1JcWJhbCBQaGFzZSAyLCBMYWhvcmU!5e0!3m2!1sen!2spk!4v1"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "400px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Uzay Beauty Hub Location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
