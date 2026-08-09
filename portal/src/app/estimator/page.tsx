"use client";

import { useState, useEffect, useCallback } from "react";
import { ESTIMATOR_API } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Calculator, History, GitCompare, Trash2, Plus, DollarSign } from "lucide-react";

interface HouseFeatures {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
  property_name?: string;
}

interface EstimationResult {
  id: number;
  property_name: string;
  features: Omit<HouseFeatures, "property_name">;
  predicted_price: number;
  timestamp: string;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

const defaultForm: HouseFeatures = {
  square_footage: 1550,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1997,
  lot_size: 6800,
  distance_to_city_center: 4.1,
  school_rating: 7.6,
  property_name: "",
};

const fieldLabels: Record<string, string> = {
  square_footage: "Square Footage",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  year_built: "Year Built",
  lot_size: "Lot Size (sq ft)",
  distance_to_city_center: "Distance to City Center (miles)",
  school_rating: "School Rating (0-10)",
};

export default function EstimatorPage() {
  const [form, setForm] = useState<HouseFeatures>(defaultForm);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [history, setHistory] = useState<EstimationResult[]>([]);
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "history" | "compare">("form");

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${ESTIMATOR_API}/history`);
      if (res.ok) setHistory(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const validate = (): string | null => {
    if (form.square_footage <= 0) return "Square footage must be positive";
    if (form.bedrooms < 0) return "Bedrooms cannot be negative";
    if (form.bathrooms < 0) return "Bathrooms cannot be negative";
    if (form.year_built < 1800 || form.year_built > 2026) return "Year built must be between 1800 and 2026";
    if (form.lot_size <= 0) return "Lot size must be positive";
    if (form.distance_to_city_center < 0) return "Distance cannot be negative";
    if (form.school_rating < 0 || form.school_rating > 10) return "School rating must be between 0 and 10";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${ESTIMATOR_API}/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Estimation failed");
      const data = await res.json();
      setResult(data);
      await fetchHistory();
    } catch (err: any) {
      setError(err.message || "Failed to get estimate");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    await fetch(`${ESTIMATOR_API}/history`, { method: "DELETE" });
    setHistory([]);
    setCompareIds(new Set());
  };

  const toggleCompare = (id: number) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const formatPrice = (p: number) => `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const chartData = history.slice(-10).map((h) => ({
    name: h.property_name.length > 12 ? h.property_name.slice(0, 12) + "..." : h.property_name,
    price: Math.round(h.predicted_price),
  }));

  const compareData = history.filter((h) => compareIds.has(h.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Property Value Estimator</h1>
        <p className="mt-1 text-gray-600">Enter property details to get an estimated market value.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: "form", label: "Estimate", icon: Calculator },
          { id: "history", label: `History (${history.length})`, icon: History },
          { id: "compare", label: "Compare", icon: GitCompare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "form" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Property Details</h2>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Property Name (optional)</label>
                <input
                  type="text"
                  value={form.property_name}
                  onChange={(e) => setForm({ ...form, property_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. My Dream Home"
                />
              </div>
              {Object.entries(fieldLabels).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
                  <input
                    type="number"
                    step={key === "bathrooms" || key === "distance_to_city_center" || key === "school_rating" ? 0.1 : 1}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <><div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Calculating...</>
              ) : (
                <><DollarSign className="h-5 w-5" /> Get Estimate</>
              )}
            </button>
          </form>

          {/* Result */}
          <div className="space-y-6">
            {result ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-green-900">Estimated Value</h2>
                <div className="mt-2 text-4xl font-bold text-green-700">{formatPrice(result.predicted_price)}</div>
                <p className="mt-1 text-sm text-green-600">for {result.property_name}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded bg-white/60 p-2"><span className="text-gray-500">Sq Ft:</span> {result.features.square_footage}</div>
                  <div className="rounded bg-white/60 p-2"><span className="text-gray-500">Beds:</span> {result.features.bedrooms}</div>
                  <div className="rounded bg-white/60 p-2"><span className="text-gray-500">Baths:</span> {result.features.bathrooms}</div>
                  <div className="rounded bg-white/60 p-2"><span className="text-gray-500">Year:</span> {result.features.year_built}</div>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-gray-400">
                Enter property details and click &quot;Get Estimate&quot;
              </div>
            )}

            {/* Chart */}
            {history.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">Recent Estimates</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatPrice(value)} />
                    <Bar dataKey="price" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-lg font-semibold">Estimation History</h2>
            {history.length > 0 && (
              <button onClick={clearHistory} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Clear All
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No estimations yet. Start by estimating a property value.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Compare</th>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Sq Ft</th>
                    <th className="px-4 py-3">Beds</th>
                    <th className="px-4 py-3">Baths</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[...history].reverse().map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={compareIds.has(h.id)}
                          onChange={() => toggleCompare(h.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">{h.property_name}</td>
                      <td className="px-4 py-3">{h.features.square_footage}</td>
                      <td className="px-4 py-3">{h.features.bedrooms}</td>
                      <td className="px-4 py-3">{h.features.bathrooms}</td>
                      <td className="px-4 py-3">{h.features.year_built}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">{formatPrice(h.predicted_price)}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(h.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "compare" && (
        <div className="space-y-6">
          {compareData.length < 2 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-400">
              Select at least 2 properties from the History tab to compare.
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {compareData.map((h) => (
                  <div key={h.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-900">{h.property_name}</h3>
                    <div className="mt-1 text-2xl font-bold text-blue-600">{formatPrice(h.predicted_price)}</div>
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between"><span>Sq Ft:</span><span>{h.features.square_footage}</span></div>
                      <div className="flex justify-between"><span>Bedrooms:</span><span>{h.features.bedrooms}</span></div>
                      <div className="flex justify-between"><span>Bathrooms:</span><span>{h.features.bathrooms}</span></div>
                      <div className="flex justify-between"><span>Year Built:</span><span>{h.features.year_built}</span></div>
                      <div className="flex justify-between"><span>Lot Size:</span><span>{h.features.lot_size}</span></div>
                      <div className="flex justify-between"><span>Distance to City:</span><span>{h.features.distance_to_city_center} mi</span></div>
                      <div className="flex justify-between"><span>School Rating:</span><span>{h.features.school_rating}/10</span></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">Price Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareData.map((h) => ({ name: h.property_name, price: Math.round(h.predicted_price) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatPrice(value)} />
                    <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                      {compareData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
