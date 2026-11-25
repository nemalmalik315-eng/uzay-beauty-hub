"use client";

import { useState, useEffect, useCallback } from "react";

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
}

interface Deal {
  id: number;
  collection: string;
  color: string;
  name: string;
  service_ids: number[];
  services: { name: string; price: number }[];
  original_price: number;
  discount_percent: number | null;
  custom_price: number | null;
  final_price: number;
  active: boolean;
}

interface Collection {
  id: number;
  name: string;
  color: string;
  start_date: string | null;
  end_date: string | null;
}

const PRESET_COLORS = [
  "#C9A84C", "#E84393", "#3B82F6", "#22C55E",
  "#EF4444", "#A855F7", "#F97316", "#0EA5E9",
  "#C05A20", "#015F2A",
];

const CATEGORY_ORDER = [
  "Hair Cut","Hair Treatment","Hair Colour","Facials","Cleansing","Polisher",
  "Body Waxing","Face Waxing","Threading","Manicure & Pedicure","Makeup",
  "Kids","Massage","Mehndi","Assistant Bridal","Signature Bridal",
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-full border-2 transition-all ${value === c ? "border-gray-800 scale-110" : "border-transparent hover:scale-110"}`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: value }} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#C9A84C"
          className="w-28 px-2 py-1 border border-gray-200 rounded text-xs font-mono focus:outline-none focus:border-amber-500"
        />
      </div>
    </div>
  );
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeCollection, setActiveCollection] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Collection edit modal
  const [editingCol, setEditingCol] = useState<Collection | null>(null);
  const [colName, setColName] = useState("");
  const [colColor, setColColor] = useState("#C9A84C");
  const [colStart, setColStart] = useState("");
  const [colEnd, setColEnd] = useState("");
  const [colSaving, setColSaving] = useState(false);

  // Deal form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formCollection, setFormCollection] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [useNewCollection, setUseNewCollection] = useState(false);
  const [newColColor, setNewColColor] = useState("#C9A84C");
  const [newColStart, setNewColStart] = useState("");
  const [newColEnd, setNewColEnd] = useState("");
  const [formName, setFormName] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [pricingType, setPricingType] = useState<"discount" | "custom" | "none">("none");
  const [discountPercent, setDiscountPercent] = useState<string>("");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [dealsRes, svcRes, colRes] = await Promise.all([
      fetch("/api/deals?admin=1"),
      fetch("/api/services"),
      fetch("/api/deal-collections"),
    ]);
    setDeals(await dealsRes.json());
    setServices(await svcRes.json());
    setCollections(await colRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const collectionNames = Array.from(new Set(deals.map((d) => d.collection)));
  const visibleDeals = activeCollection === "all" ? deals : deals.filter((d) => d.collection === activeCollection);

  const getColMeta = (name: string) => collections.find((c) => c.name === name);

  const originalPrice = selectedServiceIds.reduce((sum, id) => {
    const s = services.find((sv) => sv.id === id);
    return sum + (s?.price ?? 0);
  }, 0);

  const finalPrice = pricingType === "custom" && customPrice
    ? Number(customPrice)
    : pricingType === "discount" && discountPercent
    ? Math.round(originalPrice * (1 - Number(discountPercent) / 100))
    : originalPrice;

  const resetForm = () => {
    setEditId(null);
    setFormCollection("");
    setNewCollection("");
    setUseNewCollection(false);
    setNewColColor("#C9A84C");
    setNewColStart("");
    setNewColEnd("");
    setFormName("");
    setSelectedServiceIds([]);
    setPricingType("none");
    setDiscountPercent("");
    setCustomPrice("");
    setServiceSearch("");
    setShowForm(false);
  };

  const openAdd = () => {
    resetForm();
    if (activeCollection !== "all") setFormCollection(activeCollection);
    setShowForm(true);
  };

  const openEdit = (deal: Deal) => {
    setEditId(deal.id);
    setFormCollection(deal.collection);
    setUseNewCollection(false);
    setFormName(deal.name);
    setSelectedServiceIds(deal.service_ids);
    if (deal.custom_price !== null) {
      setPricingType("custom");
      setCustomPrice(String(deal.custom_price));
      setDiscountPercent("");
    } else if (deal.discount_percent !== null) {
      setPricingType("discount");
      setDiscountPercent(String(deal.discount_percent));
      setCustomPrice("");
    } else {
      setPricingType("none");
      setDiscountPercent("");
      setCustomPrice("");
    }
    setServiceSearch("");
    setShowForm(true);
  };

  const handleSave = async () => {
    const collection = useNewCollection ? newCollection.trim() : formCollection.trim();
    if (!collection || !formName.trim()) return;
    setSaving(true);

    if (useNewCollection) {
      await fetch("/api/deal-collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: collection,
          color: newColColor,
          start_date: newColStart || null,
          end_date: newColEnd || null,
        }),
      });
    }

    const body = {
      collection,
      name: formName.trim(),
      service_ids: selectedServiceIds,
      discount_percent: pricingType === "discount" && discountPercent ? Number(discountPercent) : null,
      custom_price: pricingType === "custom" && customPrice ? Number(customPrice) : null,
    };
    if (editId !== null) {
      await fetch(`/api/deals/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    await load();
    resetForm();
    setSaving(false);
  };

  const toggleActive = async (deal: Deal) => {
    await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !deal.active }),
    });
    setDeals((prev) => prev.map((d) => d.id === deal.id ? { ...d, active: !d.active } : d));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this deal?")) return;
    await fetch(`/api/deals/${id}`, { method: "DELETE" });
    setDeals((prev) => prev.filter((d) => d.id !== id));
  };

  const openEditCol = (col: Collection) => {
    setEditingCol(col);
    setColName(col.name);
    setColColor(col.color);
    setColStart(col.start_date ?? "");
    setColEnd(col.end_date ?? "");
  };

  const saveCollection = async () => {
    if (!editingCol) return;
    setColSaving(true);
    await fetch(`/api/deal-collections/${editingCol.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: colName.trim() || editingCol.name,
        color: colColor,
        start_date: colStart || null,
        end_date: colEnd || null,
      }),
    });
    await load();
    if (activeCollection === editingCol.name && colName.trim() && colName.trim() !== editingCol.name) {
      setActiveCollection(colName.trim());
    }
    setEditingCol(null);
    setColSaving(false);
  };

  const deleteCollection = async (col: Collection) => {
    if (!confirm(`Delete "${col.name}" and all its deals?`)) return;
    await fetch(`/api/deal-collections/${col.id}`, { method: "DELETE" });
    setActiveCollection("all");
    await load();
  };

  const toggleService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredServices = services.filter((s) =>
    serviceSearch ? s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || s.category.toLowerCase().includes(serviceSearch.toLowerCase()) : true
  );

  const categorisedServices = CATEGORY_ORDER
    .filter((cat) => filteredServices.some((s) => s.category === cat))
    .map((cat) => ({ cat, items: filteredServices.filter((s) => s.category === cat) }));

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-sm text-gray-500 mt-1">Create deal collections and add offers with discounts</p>
        </div>
        <button onClick={openAdd} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Add Deal
        </button>
      </div>

      {/* Collection tabs */}
      {collectionNames.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCollection("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCollection === "all" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            All ({deals.length})
          </button>
          {collectionNames.map((col) => {
            const meta = getColMeta(col);
            const count = deals.filter((d) => d.collection === col).length;
            const isActive = activeCollection === col;
            const color = meta?.color ?? "#C9A84C";
            return (
              <div key={col} className="flex items-center gap-0.5">
                <button
                  onClick={() => setActiveCollection(col)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-l-full text-sm font-medium transition-colors ${isActive ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  style={isActive ? { backgroundColor: color } : undefined}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: isActive ? "rgba(255,255,255,0.6)" : color }} />
                  {col} ({count})
                  {meta?.start_date && (
                    <span className={`text-xs opacity-75 ${isActive ? "text-white" : "text-gray-400"}`}>
                      {meta.start_date}{meta.end_date ? ` – ${meta.end_date}` : ""}
                    </span>
                  )}
                </button>
                {meta && (
                  <button
                    onClick={() => openEditCol(meta)}
                    className={`px-2 py-1.5 rounded-r-full text-sm transition-colors ${isActive ? "text-white/70 hover:text-white" : "bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200"}`}
                    style={isActive ? { backgroundColor: color } : undefined}
                    title="Edit collection settings"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 0 0 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Deals list */}
      {visibleDeals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No deals yet</p>
          <p className="text-sm">Click &ldquo;Add Deal&rdquo; to create your first deal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleDeals.map((deal) => {
            const meta = getColMeta(deal.collection);
            const color = meta?.color ?? "#C9A84C";
            return (
              <div key={deal.id} className={`bg-white border rounded-xl p-4 transition-all ${deal.active ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
                        {deal.collection}
                      </span>
                      <h3 className="font-semibold text-gray-900">{deal.name}</h3>
                      {!deal.active && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Hidden</span>}
                    </div>
                    {deal.services.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {deal.services.map((s, i) => (
                          <li key={i} className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                            {s.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      {deal.discount_percent !== null && (
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          {deal.discount_percent}% off
                        </span>
                      )}
                      {deal.custom_price !== null && (
                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          Custom price
                        </span>
                      )}
                      {deal.original_price > 0 && deal.final_price !== deal.original_price && (
                        <span className="text-sm text-gray-400 line-through">Rs. {deal.original_price.toLocaleString()}</span>
                      )}
                      <span className="text-base font-bold text-amber-700">Rs. {deal.final_price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(deal)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${deal.active ? "bg-green-500" : "bg-gray-300"}`}
                      title={deal.active ? "Hide from clients" : "Show to clients"}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${deal.active ? "left-5" : "left-0.5"}`} />
                    </button>
                    <button onClick={() => openEdit(deal)} className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors" title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(deal.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Collection modal */}
      {editingCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">Edit Collection</h2>
              <button onClick={() => setEditingCol(null)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Collection Name</label>
                <input
                  type="text"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tab Color</label>
                <ColorPicker value={colColor} onChange={setColColor} />
                <div className="mt-3 flex items-center gap-3">
                  <div className="px-4 py-1.5 rounded-full text-sm font-medium text-white" style={{ backgroundColor: colColor }}>
                    {colName || "Preview"}
                  </div>
                  <span className="text-xs text-gray-400">Preview</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={colStart}
                    onChange={(e) => setColStart(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={colEnd}
                    onChange={(e) => setColEnd(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              {(colStart || colEnd) && (
                <p className="text-xs text-gray-500">
                  Deals will be visible to clients {colStart ? `from ${colStart}` : ""}{colStart && colEnd ? " " : ""}{colEnd ? `until ${colEnd}` : ""}
                </p>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button
                onClick={() => deleteCollection(editingCol)}
                className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
              >
                Delete Collection
              </button>
              <div className="flex-1" />
              <button onClick={() => setEditingCol(null)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveCollection}
                disabled={colSaving}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {colSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Deal modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">{editId ? "Edit Deal" : "Add New Deal"}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Collection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Collection (e.g. Eid Deals)</label>
                {!useNewCollection && collectionNames.length > 0 ? (
                  <div className="flex gap-2">
                    <select
                      value={formCollection}
                      onChange={(e) => setFormCollection(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select existing…</option>
                      {collectionNames.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setUseNewCollection(true); setFormCollection(""); }}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-amber-700 hover:bg-amber-50 transition-colors whitespace-nowrap"
                    >
                      + New
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Eid Deals"
                        value={newCollection}
                        onChange={(e) => setNewCollection(e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                      />
                      {collectionNames.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setUseNewCollection(false); setNewCollection(""); }}
                          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          Existing
                        </button>
                      )}
                    </div>
                    {/* New collection settings */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Collection Settings</p>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Tab Color</label>
                        <ColorPicker value={newColColor} onChange={setNewColColor} />
                        {newCollection && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: newColColor }}>
                              {newCollection}
                            </div>
                            <span className="text-xs text-gray-400">Preview</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={newColStart}
                            onChange={(e) => setNewColStart(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                          <input
                            type="date"
                            value={newColEnd}
                            onChange={(e) => setNewColEnd(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Deal name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Deal 01, Bridal Package"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services included
                  {selectedServiceIds.length > 0 && (
                    <span className="ml-2 text-xs text-amber-700 font-normal">{selectedServiceIds.length} selected · Original Rs. {originalPrice.toLocaleString()}</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Search services…"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:border-amber-500"
                />
                <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto divide-y divide-gray-50">
                  {categorisedServices.map(({ cat, items }) => (
                    <div key={cat}>
                      <div className="px-3 py-1.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky top-0">{cat}</div>
                      {items.map((s) => {
                        const checked = selectedServiceIds.includes(s.id);
                        return (
                          <label key={s.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-amber-50 transition-colors ${checked ? "bg-amber-50/50" : ""}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleService(s.id)}
                              className="accent-amber-600 w-4 h-4 flex-shrink-0"
                            />
                            <span className="flex-1 text-sm text-gray-700">{s.name}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">Rs. {s.price.toLocaleString()}</span>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pricing</label>
                <div className="flex gap-2 mb-3">
                  {(["none", "discount", "custom"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setPricingType(type); setDiscountPercent(""); setCustomPrice(""); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${pricingType === type ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-600 border-gray-200 hover:border-amber-400"}`}
                    >
                      {type === "none" ? "No discount" : type === "discount" ? "% Discount" : "Custom price"}
                    </button>
                  ))}
                </div>
                {pricingType === "discount" && (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      placeholder="e.g. 20"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-32 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-sm text-gray-500">% off</span>
                    {discountPercent && originalPrice > 0 && (
                      <span className="text-sm text-gray-500">→ <strong className="text-amber-700">Rs. {Math.round(originalPrice * (1 - Number(discountPercent) / 100)).toLocaleString()}</strong></span>
                    )}
                  </div>
                )}
                {pricingType === "custom" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 3500"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-40 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
                {selectedServiceIds.length > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    Final price: <strong className="text-amber-700">Rs. {finalPrice.toLocaleString()}</strong>
                    {finalPrice < originalPrice && originalPrice > 0 && (
                      <span className="ml-2 text-green-600 text-xs">saves Rs. {(originalPrice - finalPrice).toLocaleString()}</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t">
              <button onClick={resetForm} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !(useNewCollection ? newCollection.trim() : formCollection.trim()) || !formName.trim()}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Deal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
