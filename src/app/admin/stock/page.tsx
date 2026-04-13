"use client";

import { useState, useEffect } from "react";
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

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [showLow, setShowLow] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [deletingItem, setDeletingItem] = useState<StockItem | null>(null);
  const [form, setForm] = useState({
    product_name: "",
    category: "",
    quantity: 0,
    min_threshold: 5,
    unit_price: 0,
  });
  const { toast } = useToast();

  const loadStock = async () => {
    const url = showLow ? "/api/stock?low_stock=true" : "/api/stock";
    const res = await fetch(url);
    const data = await res.json();
    setItems(data.items);
    setLowStockCount(data.lowStockCount);
  };

  useEffect(() => {
    loadStock();
  }, [showLow]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("Product added");
      setForm({ product_name: "", category: "", quantity: 0, min_threshold: 5, unit_price: 0 });
      setShowAdd(false);
      loadStock();
    } else {
      toast("Failed to add product", "error");
    }
  };

  const updateQuantity = async (id: number) => {
    const res = await fetch("/api/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity: editQty }),
    });
    if (res.ok) {
      toast("Quantity updated");
      setEditingId(null);
      loadStock();
    } else {
      toast("Failed to update quantity", "error");
    }
  };

  const deleteItem = async (item: StockItem) => {
    const res = await fetch(`/api/stock?id=${item.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Product deleted");
      setDeletingItem(null);
      loadStock();
    } else {
      toast("Failed to delete product", "error");
    }
  };

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-6">
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          <div>
            <p className="font-semibold text-red-700">
              {lowStockCount} item(s) running low on stock!
            </p>
            <p className="text-sm text-red-600">
              These items are at or below their minimum threshold.
            </p>
          </div>
          <button
            onClick={() => setShowLow(!showLow)}
            className="ml-auto text-sm font-medium text-red-700 hover:text-red-800 px-3 py-1 rounded bg-red-100"
          >
            {showLow ? "Show All" : "Show Low Stock"}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn-gold text-sm py-2"
          >
            + Add Product
          </button>
          <button
            onClick={() => setShowLow(!showLow)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showLow ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {showLow ? "Show All" : `Low Stock (${lowStockCount})`}
          </button>
          <div className="ml-auto text-sm text-gray-500">
            {items.length} product(s)
          </div>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={addItem} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">New Product</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Product Name *"
              required
              value={form.product_name}
              onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
            <input
              type="text"
              placeholder="Category *"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
              list="stock-categories"
            />
            <datalist id="stock-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <input
              type="number"
              placeholder="Quantity"
              min={0}
              value={form.quantity || ""}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
            <input
              type="number"
              placeholder="Min Threshold"
              min={0}
              value={form.min_threshold || ""}
              onChange={(e) => setForm({ ...form, min_threshold: parseInt(e.target.value) || 5 })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
            <input
              type="number"
              placeholder="Unit Price"
              min={0}
              step={0.01}
              value={form.unit_price || ""}
              onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-gold text-sm py-2">Add Product</button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Stock table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Quantity</th>
                <th className="px-6 py-3">Min Threshold</th>
                <th className="px-6 py-3">Unit Price</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No products found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 ${item.quantity <= item.min_threshold ? "bg-red-50/50" : ""}`}>
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">{item.product_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                    <td className="px-6 py-4">
                      {editingId === item.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min={0}
                            value={editQty}
                            onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 rounded border border-gray-300 text-sm"
                          />
                          <button
                            onClick={() => updateQuantity(item.id)}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className={`font-semibold ${item.quantity <= item.min_threshold ? "text-red-600" : "text-charcoal"}`}>
                          {item.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.min_threshold}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">Rs. {item.unit_price.toFixed(0)}</td>
                    <td className="px-6 py-4">
                      {item.quantity <= item.min_threshold ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditQty(item.quantity);
                          }}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                        >
                          Update Qty
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
