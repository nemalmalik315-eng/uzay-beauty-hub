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
                  <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> Visit Us
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
                  <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg> Call Us
                </h3>
                <p className="text-gray-600">
                  <a href="tel:+923344198243" className="hover:text-gold transition-colors">
                    0334 4198243
                  </a>
                </p>
              </div>

              <div className="card">
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg> WhatsApp
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
                  <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Business Hours
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
