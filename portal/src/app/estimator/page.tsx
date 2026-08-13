"use client";

import { useState, useEffect, useCallback } from "react";
import { ESTIMATOR_API } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Calculator, History, GitCompare, Trash2, DollarSign, Table, CheckCircle2 } from "lucide-react";

type FormValues = {
  square_footage: string;
  bedrooms: string;
  bathrooms: string;
  year_built: string;
  lot_size: string;
  distance_to_city_center: string;
  school_rating: string;
  property_name: string;
};

interface EstimationResult {
  id: number;
  property_name: string;
  features: Record<string, number>;
  predicted_price: number;
  timestamp: string;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

const defaultForm: FormValues = {
  square_footage: "1550",
  bedrooms: "3",
  bathrooms: "2",
  year_built: "1997",
  lot_size: "6800",
  distance_to_city_center: "4.1",
  school_rating: "7.6",
  property_name: "",
};

interface FieldConfig {
  key: keyof Omit<FormValues, "property_name">;
  label: string;
  step: string;
  min?: number;
  max?: number;
  isInteger?: boolean;
}

const fieldConfigs: FieldConfig[] = [
  { key: "square_footage", label: "Square Footage", step: "any", min: 0.01 },
  { key: "bedrooms", label: "Bedrooms", step: "1", min: 0, isInteger: true },
  { key: "bathrooms", label: "Bathrooms", step: "any", min: 0 },
  { key: "year_built", label: "Year Built", step: "1", min: 1800, max: 2026, isInteger: true },
  { key: "lot_size", label: "Lot Size (sq ft)", step: "any", min: 0.01 },
  { key: "distance_to_city_center", label: "Distance to City Center (miles)", step: "any", min: 0 },
  { key: "school_rating", label: "School Rating (0-10)", step: "any", min: 0, max: 10 },
];

export default function EstimatorPage() {
  const [form, setForm] = useState<FormValues>(defaultForm);
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
    const val = (k: keyof FormValues) => {
      const v = form[k];
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    const sf = val("square_footage");
    if (sf === null) errs.square_footage = "Required";
    else if (sf <= 0) errs.square_footage = "Must be greater than 0";

    const beds = val("bedrooms");
    if (beds === null) errs.bedrooms = "Required";
    else if (beds < 0) errs.bedrooms = "Must be 0 or greater";
    else if (!Number.isInteger(beds)) errs.bedrooms = "Must be an integer";

    const baths = val("bathrooms");
    if (baths === null) errs.bathrooms = "Required";
    else if (baths < 0) errs.bathrooms = "Must be 0 or greater";

    const yb = val("year_built");
    if (yb === null) errs.year_built = "Required";
    else if (!Number.isInteger(yb)) errs.year_built = "Must be an integer";
    else if (yb < 1800 || yb > 2026) errs.year_built = "Must be between 1800 and 2026";

    const ls = val("lot_size");
    if (ls === null) errs.lot_size = "Required";
    else if (ls <= 0) errs.lot_size = "Must be greater than 0";

    const dist = val("distance_to_city_center");
    if (dist === null) errs.distance_to_city_center = "Required";
    else if (dist < 0) errs.distance_to_city_center = "Must be 0 or greater";

    const sr = val("school_rating");
    if (sr === null) errs.school_rating = "Required";
    else if (sr < 0 || sr > 10) errs.school_rating = "Must be between 0 and 10";

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const body = {
        square_footage: Number(form.square_footage),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        year_built: Number(form.year_built),
        lot_size: Number(form.lot_size),
        distance_to_city_center: Number(form.distance_to_city_center),
        school_rating: Number(form.school_rating),
        property_name: form.property_name || undefined,
      };
      const res = await fetch(`${ESTIMATOR_API}/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const handleNumberChange = (key: keyof FormValues, rawValue: string) => {
    setForm({ ...form, [key]: rawValue });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Property Value Estimator</h1>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">Enter property details to get an estimated market value.</p>
      </div>

      {/* Tabs - scrollable on mobile */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 sm:gap-2" role="tablist">
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
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-all duration-200 sm:px-4 ${
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
          <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Property Details</h2>
            {errors._form && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{errors._form}</div>
            )}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
                    value={form[key]}
                    onChange={(e) => handleNumberChange(key, e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-1 ${
                      errors[key]
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    inputMode={key === "bedrooms" || key === "year_built" ? "numeric" : "decimal"}
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
                <div className="flex gap-2 overflow-x-auto">
                  {[
                    { id: "card", label: "Card", icon: DollarSign },
                    { id: "table", label: "Table", icon: Table },
                    { id: "chart", label: "Chart", icon: BarChart },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setResultView(id as any)}
                      className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
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
                  <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-sm transition-all duration-300 animate-slideUp sm:p-6">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Estimation Complete</span>
                    </div>
                    <div className="mt-2 text-3xl font-bold text-green-700 sm:text-4xl">{formatPrice(result.predicted_price)}</div>
                    <p className="mt-1 text-sm text-green-600">for {result.property_name}</p>
                    <div className="mt-4 overflow-x-auto rounded-lg border border-green-200">
                      <table className="w-full min-w-[280px] text-sm">
                        <tbody className="divide-y divide-green-200">
                          {Object.entries(result.features).map(([key, val]) => {
                            const label = fieldConfigs.find(f => f.key === key)?.label || key;
                            return (
                              <tr key={key} className="bg-white/60">
                                <td className="whitespace-nowrap px-3 py-2 text-gray-500">{label}</td>
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
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-slideUp sm:p-6">
                    <h3 className="mb-4 text-lg font-semibold">Prediction Result</h3>
                    <table className="w-full min-w-[600px] text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-600">Property</th>
                          <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">Sq Ft</th>
                          <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">Beds</th>
                          <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">Baths</th>
                          <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">Year</th>
                          <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">Lot Size</th>
                          <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">Dist (mi)</th>
                          <th className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">School</th>
                          <th className="whitespace-nowrap px-3 py-2 text-right font-semibold text-green-700">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultTableData.map((r) => (
                          <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="whitespace-nowrap px-3 py-2 font-medium">{r.property_name}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">{r.features.square_footage}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">{r.features.bedrooms}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">{r.features.bathrooms}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">{r.features.year_built}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">{Number(r.features.lot_size).toLocaleString()}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">{r.features.distance_to_city_center}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">{r.features.school_rating}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-bold text-green-700">{formatPrice(r.predicted_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {resultView === "chart" && history.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-slideUp sm:p-6">
                    <h3 className="mb-4 text-lg font-semibold">Result vs Recent Estimates</h3>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
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
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-400">
                Enter property details and click &quot;Get Estimate&quot;
              </div>
            )}

            {/* Chart */}
            {history.length > 0 && resultView !== "chart" && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h3 className="mb-4 text-lg font-semibold">Recent Estimates</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: any) => formatPrice(value as number)} />
                      <Bar dataKey="price" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-lg font-semibold">Estimation History</h2>
            {history.length > 0 && (
              <button onClick={clearHistory} className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Clear All
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-400 sm:p-12">No estimations yet. Start by estimating a property value.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
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
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{h.property_name}</td>
                      <td className="whitespace-nowrap px-4 py-3">{h.features.square_footage}</td>
                      <td className="whitespace-nowrap px-4 py-3">{h.features.bedrooms}</td>
                      <td className="whitespace-nowrap px-4 py-3">{h.features.bathrooms}</td>
                      <td className="whitespace-nowrap px-4 py-3">{h.features.year_built}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-green-700">{formatPrice(h.predicted_price)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{new Date(h.timestamp).toLocaleString()}</td>
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
            <div className="rounded-xl border-dashed border-gray-300 bg-white p-8 text-center text-gray-400 sm:p-12">
              Select at least 2 properties from the History tab to compare.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full min-w-[500px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Feature</th>
                      {compareData.map((h) => (
                        <th key={h.id} className="whitespace-nowrap px-4 py-3 text-right">{h.property_name}</th>
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
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-600">{label}</td>
                        {compareData.map((h) => {
                          const val = key === "predicted_price" ? h.predicted_price : (h.features as any)[key];
                          return (
                            <td key={h.id} className={`whitespace-nowrap px-4 py-3 text-right ${key === "predicted_price" ? "font-bold text-green-700" : ""}`}>
                              {format ? format(val) : val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h3 className="mb-4 text-lg font-semibold">Price Comparison</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareData.map((h) => ({ name: h.property_name, price: Math.round(h.predicted_price) }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
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
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
