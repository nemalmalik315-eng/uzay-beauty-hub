"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/admin/Toast";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface StockItem {
  id: number;
  product_name: string;
  category: string;
  quantity: number;
  min_threshold: number;
  unit_price: number;
  last_restocked: string;
}

const STOCK_CATEGORIES = [
  "Hair Colour",
  "Hair Treatment",
  "Skincare & Facials",
  "Waxing Products",
  "Threading Supplies",
  "Manicure & Pedicure",
  "Brushes & Tools",
  "Tissues & Cotton",
  "Massage Oils",
  "Scrub & Mask",
  "Cleansing Products",
  "Makeup Products",
  "Accessories",
  "General Supplies",
];

const BLANK_FORM = {
  product_name: "",
  category: STOCK_CATEGORIES[0],
  quantity: "",
  min_threshold: "",
};

export default function StockPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<StockItem[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [filterCat, setFilterCat] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [deletingItem, setDeletingItem] = useState<StockItem | null>(null);

  // Restock: show inline "+N units" input
  const [restockingId, setRestockingId] = useState<number | null>(null);
  const [restockQty, setRestockQty] = useState("");

  // Edit min threshold inline
  const [editThreshId, setEditThreshId] = useState<number | null>(null);
  const [editThreshVal, setEditThreshVal] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/stock");
    const data = await res.json();
    setItems(Array.isArray(data.items) ? data.items : []);
    setLowStockCount(data.lowStockCount ?? 0);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Categories that actually exist in stock, for filter tabs
  const presentCategories = ["All", ...STOCK_CATEGORIES.filter((c) =>
    items.some((i) => i.category === c)
  )];

  const filtered = filterCat === "All"
    ? items
    : items.filter((i) => i.category === filterCat);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_name.trim() || !form.category) {
      toast("Product name and category are required", "error");
      return;
    }
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_name: form.product_name.trim(),
        category: form.category,
        quantity: parseInt(form.quantity) || 0,
        min_threshold: parseInt(form.min_threshold) || 0,
        unit_price: 0,
      }),
    });
    if (res.ok) {
      toast("Product added");
      setForm(BLANK_FORM);
      setShowAdd(false);
      load();
    } else {
      toast("Failed to add product", "error");
    }
  };

  const quickMinus = async (item: StockItem) => {
    if (item.quantity <= 0) return;
    const res = await fetch("/api/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, quantity: item.quantity - 1 }),
    });
    if (res.ok) load();
    else toast("Failed to update", "error");
  };

  const restock = async (item: StockItem) => {
    const added = parseInt(restockQty);
    if (!added || added <= 0) { toast("Enter a valid amount", "error"); return; }
    const res = await fetch("/api/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, quantity: item.quantity + added }),
    });
    if (res.ok) {
      toast(`+${added} units added`);
      setRestockingId(null);
      setRestockQty("");
      load();
    } else {
      toast("Failed to restock", "error");
    }
  };

  const saveThreshold = async (item: StockItem) => {
    const val = parseInt(editThreshVal);
    if (isNaN(val) || val < 0) { toast("Enter a valid threshold", "error"); return; }
    const res = await fetch("/api/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, min_threshold: val }),
    });
    if (res.ok) {
      toast("Threshold updated");
      setEditThreshId(null);
      load();
    } else {
      toast("Failed to update threshold", "error");
    }
  };

  const deleteItem = async (item: StockItem) => {
    const res = await fetch(`/api/stock?id=${item.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Product deleted");
      setDeletingItem(null);
      load();
    } else {
      toast("Failed to delete product", "error");
    }
  };

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={!!deletingItem}
        title="Delete Product"
        message={`Delete "${deletingItem?.product_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={() => deletingItem && deleteItem(deletingItem)}
        onCancel={() => setDeletingItem(null)}
      />

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-red-700">
            {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} running low on stock
          </p>
          <button
            onClick={() => setFilterCat(filterCat === "Low Stock" ? "All" : "Low Stock")}
            className="ml-auto text-xs font-medium text-red-700 hover:text-red-900 px-3 py-1.5 rounded-lg bg-red-100 whitespace-nowrap"
          >
            {filterCat === "Low Stock" ? "Show All" : "View Low Stock"}
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={() => { setShowAdd(!showAdd); setForm(BLANK_FORM); }}
          className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90 transition-colors"
        >
          + Add Product
        </button>
        <span className="text-sm text-gray-400 ml-auto">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={addItem} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-heading text-base font-semibold text-charcoal mb-4">New Product</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Product name *"
              required
              value={form.product_name}
              onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
            <select
              required
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none bg-white"
            >
              {STOCK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="number"
              placeholder="Quantity"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
            <input
              type="number"
              placeholder="Min threshold (alert level)"
              min={0}
              value={form.min_threshold}
              onChange={(e) => setForm((f) => ({ ...f, min_threshold: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-medium hover:bg-gold/90">
              Add Product
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(filterCat === "Low Stock"
          ? ["All", "Low Stock", ...STOCK_CATEGORIES.filter((c) => items.some((i) => i.category === c))]
          : presentCategories
        ).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              filterCat === cat
                ? cat === "Low Stock"
                  ? "bg-red-500 text-white"
                  : "bg-gold text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gold hover:text-gold"
            }`}
          >
            {cat}
            {cat === "Low Stock" && lowStockCount > 0 && (
              <span className="ml-1.5 bg-white/30 px-1 rounded-full">{lowStockCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Quantity</th>
                <th className="px-5 py-3">Min Alert</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(filterCat === "Low Stock"
                ? items.filter((i) => i.quantity <= i.min_threshold)
                : filtered
              ).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">No products found</td>
                </tr>
              ) : (
                (filterCat === "Low Stock" ? items.filter((i) => i.quantity <= i.min_threshold) : filtered).map((item) => {
                  const isLow = item.quantity <= item.min_threshold;
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50/50 ${isLow ? "bg-red-50/40" : ""}`}>
                      <td className="px-5 py-3.5 text-sm font-medium text-charcoal">{item.product_name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{item.category}</td>
                      <td className="px-5 py-3.5">
                        {restockingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{item.quantity} +</span>
                            <input
                              type="number"
                              min={1}
                              autoFocus
                              value={restockQty}
                              onChange={(e) => setRestockQty(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") restock(item); if (e.key === "Escape") { setRestockingId(null); setRestockQty(""); } }}
                              className="w-16 px-2 py-1 rounded border border-gray-300 text-sm text-center"
                              placeholder="qty"
                            />
                            <button onClick={() => restock(item)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Save</button>
                            <button onClick={() => { setRestockingId(null); setRestockQty(""); }} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => quickMinus(item)}
                              disabled={item.quantity <= 0}
                              title="Use 1 unit"
                              className="w-6 h-6 rounded bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-sm font-bold disabled:opacity-30 transition-colors"
                            >
                              −
                            </button>
                            <span className={`font-semibold text-sm w-8 text-center ${isLow ? "text-red-600" : "text-charcoal"}`}>
                              {item.quantity}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {editThreshId === item.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              autoFocus
                              value={editThreshVal}
                              onChange={(e) => setEditThreshVal(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveThreshold(item); if (e.key === "Escape") setEditThreshId(null); }}
                              className="w-14 px-2 py-1 rounded border border-gray-300 text-sm text-center"
                            />
                            <button onClick={() => saveThreshold(item)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">✓</button>
                            <button onClick={() => setEditThreshId(null)} className="text-xs text-gray-400">✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditThreshId(item.id); setEditThreshVal(String(item.min_threshold)); }}
                            title="Click to edit"
                            className="text-sm text-gray-500 hover:text-gold hover:underline"
                          >
                            {item.min_threshold}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setRestockingId(item.id); setRestockQty(""); }}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-medium"
                          >
                            + Restock
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {(filterCat === "Low Stock"
          ? items.filter((i) => i.quantity <= i.min_threshold)
          : filtered
        ).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-12 text-center text-gray-400 text-sm">
            No products found
          </div>
        ) : (
          (filterCat === "Low Stock" ? items.filter((i) => i.quantity <= i.min_threshold) : filtered).map((item) => {
            const isLow = item.quantity <= item.min_threshold;
            return (
              <div key={item.id} className={`bg-white rounded-xl border shadow-sm p-4 ${isLow ? "border-red-200" : "border-gray-100"}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-charcoal">{item.product_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {isLow ? "Low Stock" : "In Stock"}
                  </span>
                </div>

                {/* Quantity row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1">
                    <span className="text-xs text-gray-500">Qty:</span>
                    <button
                      onClick={() => quickMinus(item)}
                      disabled={item.quantity <= 0}
                      className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 flex items-center justify-center text-sm font-bold disabled:opacity-30 shadow-sm"
                    >
                      −
                    </button>
                    <span className={`font-bold text-base min-w-[2rem] text-center ${isLow ? "text-red-600" : "text-charcoal"}`}>
                      {item.quantity}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Min: <button
                      onClick={() => { setEditThreshId(item.id); setEditThreshVal(String(item.min_threshold)); }}
                      className="text-gray-600 hover:text-gold underline"
                    >{item.min_threshold}</button>
                  </div>
                </div>

                {/* Restock row */}
                {restockingId === item.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Add units:</span>
                    <input
                      type="number"
                      min={1}
                      autoFocus
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-center"
                      placeholder="e.g. 10"
                    />
                    <button onClick={() => restock(item)} className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg">Save</button>
                    <button onClick={() => { setRestockingId(null); setRestockQty(""); }} className="text-gray-400 text-xs px-1">✕</button>
                  </div>
                ) : editThreshId === item.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Min alert level:</span>
                    <input
                      type="number"
                      min={0}
                      autoFocus
                      value={editThreshVal}
                      onChange={(e) => setEditThreshVal(e.target.value)}
                      className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-center"
                    />
                    <button onClick={() => saveThreshold(item)} className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">Save</button>
                    <button onClick={() => setEditThreshId(null)} className="text-gray-400 text-xs px-1">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setRestockingId(item.id); setRestockQty(""); }}
                      className="flex-1 py-2 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-100"
                    >
                      + Restock
                    </button>
                    <button
                      onClick={() => setDeletingItem(item)}
                      className="px-4 py-2 bg-red-50 text-red-500 text-xs rounded-lg hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
