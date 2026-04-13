"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  duration: number;
}

export default function BookPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setServices(data));
  }, []);

  const categories = ["All", ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServices =
    activeCategory === "All"
      ? services
      : services.filter((s) => s.category === activeCategory);

  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectedDetails = services.filter((s) => selectedServices.includes(s.id));
  const totalPrice = selectedDetails.reduce((sum, s) => sum + s.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          service_ids: selectedServices,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setForm({ name: "", phone: "", date: "", time: "", notes: "" });
        setSelectedServices([]);
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <Navbar />

      <section className="pt-28 pb-16 px-4 bg-charcoal-dark">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gold font-medium tracking-wider uppercase text-sm mb-3">
            Reserve Your Spot
          </p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            Book an Appointment
          </h1>
          <p className="text-gray-300 text-lg">
            Choose your services, pick a date, and you&apos;re all set
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-cream">
        <div className="max-w-4xl mx-auto">
          {submitted ? (
            <div className="card text-center py-12">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gold" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-heading font-bold text-charcoal mb-2">
                Booking Confirmed!
              </h2>
              <p className="text-gray-500 mb-6">
                We&apos;ll contact you shortly to confirm your appointment.
              </p>
              <button onClick={() => setSubmitted(false)} className="btn-gold">
                Book Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Select Services */}
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 bg-gold text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <h2 className="text-xl font-heading font-bold text-charcoal">
                    Choose Your Services
                  </h2>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeCategory === cat
                          ? "bg-gold text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Service Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredServices.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service.id)}
                        className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-gold bg-gold/5 shadow-sm"
                            : "border-gray-100 bg-white hover:border-gold/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${isSelected ? "text-charcoal" : "text-gray-700"}`}>
                              {service.name}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-gold font-semibold text-sm">
                                Rs. {service.price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected
                                ? "border-gold bg-gold"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Summary */}
                {selectedDetails.length > 0 && (
                  <div className="mt-6 p-4 bg-gold/5 border border-gold/20 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-charcoal">
                        {selectedDetails.length} service{selectedDetails.length > 1 ? "s" : ""} selected
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedServices([])}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {selectedDetails.map((s) => (
                        <div key={s.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{s.name}</span>
                          <span className="text-gray-500">Rs. {s.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gold/20 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-charcoal">
                          Total: Rs. {totalPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Your Details */}
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 bg-gold text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <h2 className="text-xl font-heading font-bold text-charcoal">
                    Your Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all bg-white"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all bg-white"
                      placeholder="+92 300 1234567"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Date & Time */}
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 bg-gold text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <h2 className="text-xl font-heading font-bold text-charcoal">
                    Pick Date & Time
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Preferred Time *
                    </label>
                    <select
                      required
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all bg-white"
                    >
                      <option value="">Select time...</option>
                      {[
                        "11:00 AM", "11:30 AM",
                        "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
                        "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
                        "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
                        "6:00 PM", "6:30 PM", "7:00 PM",
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes + Submit */}
              <div className="card">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all bg-white resize-none"
                    placeholder="Any special requests or notes..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || selectedServices.length === 0}
                  className="btn-gold w-full text-lg py-4 mt-4 disabled:opacity-50"
                >
                  {loading
                    ? "Booking..."
                    : selectedServices.length === 0
                    ? "Select at least one service"
                    : `Confirm Booking — Rs. ${totalPrice.toLocaleString()}`}
                </button>

                <div className="text-center mt-4">
                  <p className="text-gray-400 text-sm">Or book via</p>
                  <a
                    href="https://wa.me/923344198243?text=Hi!%20I%20would%20like%20to%20book%20an%20appointment"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-2 text-green-600 hover:text-green-700 font-medium"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp: 0334 4198243
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
