"use client";

import { useState, useEffect, useCallback } from "react";
import { ESTIMATOR_API } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Calculator, History, GitCompare, Trash2, DollarSign, Table, CheckCircle2 } from "lucide-react";

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

const fieldConfigs: { key: keyof HouseFeatures; label: string; step: number; min?: number; max?: number; required?: boolean }[] = [
  { key: "square_footage", label: "Square Footage", step: 1, min: 1 },
  { key: "bedrooms", label: "Bedrooms", step: 1, min: 0 },
  { key: "bathrooms", label: "Bathrooms", step: 0.5, min: 0 },
  { key: "year_built", label: "Year Built", step: 1, min: 1800, max: 2026 },
  { key: "lot_size", label: "Lot Size (sq ft)", step: 100, min: 1 },
  { key: "distance_to_city_center", label: "Distance to City Center (miles)", step: 0.1, min: 0 },
  { key: "school_rating", label: "School Rating (0-10)", step: 0.1, min: 0, max: 10 },
];

export default function EstimatorPage() {
  const [form, setForm] = useState<HouseFeatures>(defaultForm);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [history, setHistory] = useState<EstimationResult[]>([]);
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"form" | "history" | "compare">("form");
  const [resultView, setResultView] = useState<"card" | "table" | "chart">("card");

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${ESTIMATOR_API}/history`);
      if (res.ok) setHistory(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.square_footage || form.square_footage <= 0) errs.square_footage = "Must be positive";
    if (form.bedrooms < 0) errs.bedrooms = "Cannot be negative";
    if (form.bathrooms < 0) errs.bathrooms = "Cannot be negative";
    if (!form.year_built || form.year_built < 1800 || form.year_built > 2026) errs.year_built = "Must be 1800-2026";
    if (!form.lot_size || form.lot_size <= 0) errs.lot_size = "Must be positive";
    if (form.distance_to_city_center < 0) errs.distance_to_city_center = "Cannot be negative";
    if (!form.school_rating || form.school_rating < 0 || form.school_rating > 10) errs.school_rating = "Must be 0-10";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
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
      setResultView("card");
      await fetchHistory();
    } catch (err: any) {
      setErrors({ _form: err.message || "Failed to get estimate" });
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

  const formatPrice = (p: number | undefined) => {
    if (p == null) return "";
    return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  };

  const chartData = history.slice(-10).map((h) => ({
    name: h.property_name.length > 12 ? h.property_name.slice(0, 12) + "..." : h.property_name,
    price: Math.round(h.predicted_price),
  }));

  const compareData = history.filter((h) => compareIds.has(h.id));

  const resultTableData = result ? [result] : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Property Value Estimator</h1>
        <p className="mt-1 text-gray-600">Enter property details to get an estimated market value.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200" role="tablist">
        {[
          { id: "form", label: "Estimate", icon: Calculator },
          { id: "history", label: `History (${history.length})`, icon: History },
          { id: "compare", label: "Compare", icon: GitCompare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
          <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <h2 className="mb-4 text-lg font-semibold">Property Details</h2>
            {errors._form && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{errors._form}</div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="property_name" className="mb-1 block text-sm font-medium text-gray-700">Property Name (optional)</label>
                <input
                  id="property_name"
                  type="text"
                  value={form.property_name}
                  onChange={(e) => setForm({ ...form, property_name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. My Dream Home"
                />
              </div>
              {fieldConfigs.map(({ key, label, step, min, max }) => (
                <div key={key}>
                  <label htmlFor={key} className="mb-1 block text-sm font-medium text-gray-700">
                    {label}
                    {errors[key] && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  <input
                    id={key}
                    type="number"
                    step={step}
                    min={min}
                    max={max}
                    value={(form as any)[key]}
                    onChange={(e) => {
                      setForm({ ...form, [key]: parseFloat(e.target.value) || 0 });
                      if (errors[key]) setErrors({ ...errors, [key]: "" });
                    }}
                    className={`w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-1 ${
                      errors[key]
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    required
                    aria-label={label}
                    aria-invalid={!!errors[key]}
                    aria-describedby={errors[key] ? `${key}-error` : undefined}
                  />
                  {errors[key] && (
                    <p id={`${key}-error`} className="mt-1 text-xs text-red-600" role="alert">{errors[key]}</p>
                  )}
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
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
              <>
                {/* Result View Toggle */}
                <div className="flex gap-2">
                  {[
                    { id: "card", label: "Card", icon: DollarSign },
                    { id: "table", label: "Table", icon: Table },
                    { id: "chart", label: "Chart", icon: BarChart },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setResultView(id as any)}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        resultView === id
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {resultView === "card" && (
                  <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm transition-all duration-300 animate-slideUp">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Estimation Complete</span>
                    </div>
                    <div className="mt-2 text-4xl font-bold text-green-700">{formatPrice(result.predicted_price)}</div>
                    <p className="mt-1 text-sm text-green-600">for {result.property_name}</p>
                    <div className="mt-4 overflow-hidden rounded-lg border border-green-200">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-green-200">
                          {Object.entries(result.features).map(([key, val]) => {
                            const label = fieldConfigs.find(f => f.key === key)?.label || key;
                            return (
                              <tr key={key} className="bg-white/60">
                                <td className="px-3 py-2 text-gray-500">{label}</td>
                                <td className="px-3 py-2 text-right font-medium">{val}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {resultView === "table" && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-slideUp">
                    <h3 className="mb-4 text-lg font-semibold">Prediction Result</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Property</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Sq Ft</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Beds</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Baths</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Year</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Lot Size</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Dist (mi)</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">School</th>
                            <th className="px-3 py-2 text-right font-semibold text-green-700">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultTableData.map((r) => (
                            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium">{r.property_name}</td>
                              <td className="px-3 py-2 text-right">{r.features.square_footage}</td>
                              <td className="px-3 py-2 text-right">{r.features.bedrooms}</td>
                              <td className="px-3 py-2 text-right">{r.features.bathrooms}</td>
                              <td className="px-3 py-2 text-right">{r.features.year_built}</td>
                              <td className="px-3 py-2 text-right">{r.features.lot_size.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right">{r.features.distance_to_city_center}</td>
                              <td className="px-3 py-2 text-right">{r.features.school_rating}</td>
                              <td className="px-3 py-2 text-right font-bold text-green-700">{formatPrice(r.predicted_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {resultView === "chart" && history.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-slideUp">
                    <h3 className="mb-4 text-lg font-semibold">Result vs Recent Estimates</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={[
                        ...chartData,
                        { name: result.property_name.length > 12 ? result.property_name.slice(0, 12) + "..." : result.property_name, price: Math.round(result.predicted_price), isCurrent: true }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: any) => formatPrice(value as number)} />
                        <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                          {chartData.map((_, i) => <Cell key={i} fill="#93C5FD" />)}
                          <Cell fill="#10B981" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-gray-400">
                Enter property details and click &quot;Get Estimate&quot;
              </div>
            )}

            {/* Chart */}
            {history.length > 0 && resultView !== "chart" && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">Recent Estimates</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: any) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: any) => formatPrice(value as number)} />
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
              <button onClick={clearHistory} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50">
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
                    <tr key={h.id} className="transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={compareIds.has(h.id)}
                          onChange={() => toggleCompare(h.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 transition focus:ring-blue-500"
                          aria-label={`Select ${h.property_name} for comparison`}
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
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Feature</th>
                      {compareData.map((h) => (
                        <th key={h.id} className="px-4 py-3 text-right">{h.property_name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      { key: "predicted_price", label: "Predicted Price", format: formatPrice },
                      { key: "square_footage", label: "Square Footage" },
                      { key: "bedrooms", label: "Bedrooms" },
                      { key: "bathrooms", label: "Bathrooms" },
                      { key: "year_built", label: "Year Built" },
                      { key: "lot_size", label: "Lot Size", format: (v: number) => v.toLocaleString() },
                      { key: "distance_to_city_center", label: "Distance to City (mi)" },
                      { key: "school_rating", label: "School Rating" },
                    ].map(({ key, label, format }) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-600">{label}</td>
                        {compareData.map((h) => {
                          const val = key === "predicted_price" ? h.predicted_price : (h.features as any)[key];
                          return (
                            <td key={h.id} className={`px-4 py-3 text-right ${key === "predicted_price" ? "font-bold text-green-700" : ""}`}>
                              {format ? format(val) : val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold">Price Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareData.map((h) => ({ name: h.property_name, price: Math.round(h.predicted_price) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v: any) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: any) => formatPrice(value as number)} />
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
