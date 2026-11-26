"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/admin/Toast";

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  price_max: number | null;
  duration: number | null;
  description: string | null;
  active: number;
  sort_order: number;
}

const CATEGORIES = [
  "Hair Cut", "Hair Treatment", "Hair Colour",
  "Facials", "Cleansing", "Polisher", "Scrub & Mask",
  "Body Waxing", "Face Waxing", "Threading",
  "Manicure & Pedicure", "Massage", "Makeup", "Kids",
  "Mehndi", "Assistant Bridal", "Signature Bridal",
];

const BLANK_FORM = { name: "", category: CATEGORIES[0], price: "", price_max: "", duration: "", description: "" };

export default function ServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [delConfirm, setDelConfirm] = useState<Service | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/services?all=true");
    if (res.ok) setServices(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK_FORM);
    setModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      category: s.category,
      price: String(s.price),
      price_max: s.price_max != null ? String(s.price_max) : "",
      duration: s.duration != null ? String(s.duration) : "",
      description: s.description || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category || !form.price) {
      toast("Name, category, and price are required", "error");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
      price_max: form.price_max ? parseFloat(form.price_max) : null,
      duration: form.duration ? parseInt(form.duration) : null,
      description: form.description.trim() || null,
    };

    const res = await fetch("/api/services", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
    });

    setSaving(false);
    if (res.ok) {
      toast(editing ? "Service updated" : "Service added", "success");
      setModalOpen(false);
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast((data as { error?: string }).error || "Failed to save service", "error");
    }
  };

  const toggleActive = async (s: Service) => {
    const res = await fetch("/api/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, active: s.active ? 0 : 1 }),
    });
    if (res.ok) {
      toast(s.active ? "Service deactivated" : "Service activated", "success");
      load();
    } else {
      toast("Failed to update service", "error");
    }
  };

  const handleDelete = async (s: Service) => {
    const res = await fetch(`/api/services?id=${s.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Service deleted", "success");
      setDelConfirm(null);
      load();
    } else {
      toast("Failed to delete service", "error");
    }
  };

  const filtered = services.filter((s) => {
    if (filterActive === "active" && !s.active) return false;
    if (filterActive === "inactive" && s.active) return false;
    if (filterCat && s.category !== filterCat) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped: Record<string, Service[]> = {};
  filtered.forEach((s) => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORIES.indexOf(a);
    const bi = CATEGORIES.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const totalActive = services.filter((s) => s.active).length;
  const totalCategories = new Set(services.map((s) => s.category)).size;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-charcoal">{services.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{totalActive}</div>
          <div className="text-xs text-gray-500 mt-0.5">Active</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-charcoal">{totalCategories}</div>
          <div className="text-xs text-gray-500 mt-0.5">Categories</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search services…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none min-w-[140px] flex-1"
          />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none bg-white"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive")}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none bg-white"
          >
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
            <option value="all">Show all</option>
          </select>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors whitespace-nowrap ml-auto"
          >
            + Add Service
          </button>
        </div>
      </div>

      {/* Service list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : sortedCategories.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No services found</div>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map((cat) => (
            <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-charcoal">{cat}</h3>
                <span className="text-xs text-gray-400 ml-1">({grouped[cat].length})</span>
              </div>
              <div className="divide-y divide-gray-50">
                {grouped[cat].map((s) => (
                  <div key={s.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${!s.active ? "opacity-50" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{s.name}</p>
                      {s.description && (
                        <p className="text-xs text-gray-400 truncate">{s.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 mr-2">
                      <p className="text-sm font-semibold text-charcoal">
                        Rs. {s.price.toLocaleString()}
                        {s.price_max ? ` – ${s.price_max.toLocaleString()}` : ""}
                      </p>
                      {s.duration && (
                        <p className="text-xs text-gray-400">{s.duration} min</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleActive(s)}
                        title={s.active ? "Deactivate" : "Activate"}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-sm ${
                          s.active
                            ? "bg-green-50 text-green-600 hover:bg-green-100"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        {s.active ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        title="Edit"
                        className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDelConfirm(s)}
                        title="Delete"
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-heading text-base font-semibold text-charcoal">
                {editing ? "Edit Service" : "Add Service"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl w-7 h-7 flex items-center justify-center">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
                  placeholder="e.g. Brazilian Blowout"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none bg-white"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Price (Rs.) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
                    placeholder="500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Max Price (Rs.)</label>
                  <input
                    type="number"
                    value={form.price_max}
                    onChange={(e) => setForm((f) => ({ ...f, price_max: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
                    placeholder="Leave blank if fixed"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
                  placeholder="e.g. 45"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none resize-none"
                  rows={2}
                  placeholder="Optional short description"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Service"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDelConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-heading text-base font-semibold text-charcoal mb-2">Delete service?</h3>
            <p className="text-sm text-gray-600 mb-5">
              <strong>{delConfirm.name}</strong> will be permanently deleted and cannot be recovered.
              To hide it temporarily, use the toggle instead.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDelConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(delConfirm)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
