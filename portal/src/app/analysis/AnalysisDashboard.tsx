"use client";

import { useState, useCallback } from "react";
import { MARKET_API } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  BarChart3, TrendingUp, Filter, Download, Sparkles,
  Home, DollarSign, Building, GraduationCap, FileText, FileSpreadsheet
} from "lucide-react";

interface Property {
  id: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize: number;
  distanceToCityCenter: number;
  schoolRating: number;
  price: number;
}

interface MarketStats {
  totalProperties: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  avgSquareFootage: number;
  avgPricePerSqFt: number;
  avgBedrooms: number;
  avgBathrooms: number;
  avgSchoolRating: number;
}

interface WhatIfResult {
  scenario: string;
  features: any;
  predictedPrice: number;
  priceDifference: number;
  percentageChange: number;
}

interface InitialData {
  stats: MarketStats | null;
  priceDistribution: any;
  priceByBedrooms: any;
  properties: Property[];
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const formatPrice = (p: number | undefined) => {
  if (p == null) return "";
  return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

type WhatIfForm = {
  squareFootage: string;
  bedrooms: string;
  bathrooms: string;
  yearBuilt: string;
  lotSize: string;
  distanceToCityCenter: string;
  schoolRating: string;
};

type FilterForm = {
  minBedrooms: string;
  maxBedrooms: string;
  minPrice: string;
  maxPrice: string;
  minSchoolRating: string;
};

export default function AnalysisDashboard({ initialData }: { initialData: InitialData }) {
  const [stats] = useState<MarketStats | null>(initialData.stats);
  const [properties, setProperties] = useState<Property[]>(initialData.properties);
  const [filters, setFilters] = useState<FilterForm>({ minBedrooms: "", maxBedrooms: "", minPrice: "", maxPrice: "", minSchoolRating: "" });
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [whatIf, setWhatIf] = useState<WhatIfResult[] | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfErrors, setWhatIfErrors] = useState<Record<string, string>>({});
  const [whatIfForm, setWhatIfForm] = useState<WhatIfForm>({
    squareFootage: "1800", bedrooms: "3", bathrooms: "2", yearBuilt: "2000",
    lotSize: "7500", distanceToCityCenter: "5", schoolRating: "8",
  });
  const [filterLoading, setFilterLoading] = useState(false);

  const whatIfFields = [
    { key: "squareFootage" as const, label: "Square Footage", step: "any", min: 0.01, isInteger: false },
    { key: "bedrooms" as const, label: "Bedrooms", step: "1", min: 0, isInteger: true },
    { key: "bathrooms" as const, label: "Bathrooms", step: "any", min: 0, isInteger: false },
    { key: "yearBuilt" as const, label: "Year Built", step: "1", min: 1800, max: 2026, isInteger: true },
    { key: "lotSize" as const, label: "Lot Size (sq ft)", step: "any", min: 0.01, isInteger: false },
    { key: "distanceToCityCenter" as const, label: "Distance to City (mi)", step: "any", min: 0, isInteger: false },
    { key: "schoolRating" as const, label: "School Rating (0-10)", step: "any", min: 0, max: 10, isInteger: false },
  ];

  const priceDistData = initialData.priceDistribution
    ? Object.entries(initialData.priceDistribution.distribution as Record<string, number>).map(([name, value]) => ({ name, value }))
    : [];

  const priceByBedsData = initialData.priceByBedrooms
    ? Object.entries(initialData.priceByBedrooms.data as Record<string, number>).map(([bedrooms, avgPrice]) => ({ bedrooms: `${bedrooms} BR`, avgPrice: Math.round(avgPrice) }))
    : [];

  const loadProperties = useCallback(async (f = filters, sb = sortBy, sd = sortDir) => {
    setFilterLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });
      params.set("sortBy", sb);
      params.set("sortDir", sd);
      const res = await fetch(`${MARKET_API}/api/properties?${params}`);
      if (res.ok) setProperties(await res.json());
    } finally {
      setFilterLoading(false);
    }
  }, [filters, sortBy, sortDir]);

  const handleFilter = () => loadProperties(filters, sortBy, sortDir);

  const handleSort = (col: string) => {
    const newDir = sortBy === col && sortDir === "asc" ? "desc" : "asc";
    setSortBy(col);
    setSortDir(newDir);
    loadProperties(filters, col, newDir);
  };

  const validateWhatIf = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const val = (k: keyof WhatIfForm) => {
      const v = whatIfForm[k];
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };

    const sf = val("squareFootage");
    if (sf === null) errs.squareFootage = "Required";
    else if (sf <= 0) errs.squareFootage = "Must be greater than 0";

    const beds = val("bedrooms");
    if (beds === null) errs.bedrooms = "Required";
    else if (beds < 0) errs.bedrooms = "Must be 0 or greater";
    else if (!Number.isInteger(beds)) errs.bedrooms = "Must be an integer";

    const baths = val("bathrooms");
    if (baths === null) errs.bathrooms = "Required";
    else if (baths < 0) errs.bathrooms = "Must be 0 or greater";

    const yb = val("yearBuilt");
    if (yb === null) errs.yearBuilt = "Required";
    else if (!Number.isInteger(yb)) errs.yearBuilt = "Must be an integer";
    else if (yb < 1800 || yb > 2026) errs.yearBuilt = "Must be between 1800 and 2026";

    const ls = val("lotSize");
    if (ls === null) errs.lotSize = "Required";
    else if (ls <= 0) errs.lotSize = "Must be greater than 0";

    const dist = val("distanceToCityCenter");
    if (dist === null) errs.distanceToCityCenter = "Required";
    else if (dist < 0) errs.distanceToCityCenter = "Must be 0 or greater";

    const sr = val("schoolRating");
    if (sr === null) errs.schoolRating = "Required";
    else if (sr < 0 || sr > 10) errs.schoolRating = "Must be between 0 and 10";

    return errs;
  };

  const runWhatIf = async () => {
    const errs = validateWhatIf();
    setWhatIfErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setWhatIfLoading(true);
    try {
      const body = {
        squareFootage: Number(whatIfForm.squareFootage),
        bedrooms: Number(whatIfForm.bedrooms),
        bathrooms: Number(whatIfForm.bathrooms),
        yearBuilt: Number(whatIfForm.yearBuilt),
        lotSize: Number(whatIfForm.lotSize),
        distanceToCityCenter: Number(whatIfForm.distanceToCityCenter),
        schoolRating: Number(whatIfForm.schoolRating),
      };
      const res = await fetch(`${MARKET_API}/api/what-if`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) setWhatIf(await res.json());
    } finally {
      setWhatIfLoading(false);
    }
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    window.open(`${MARKET_API}/api/export/csv?${params}`, "_blank");
  };

  const exportPdf = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    window.open(`${MARKET_API}/api/export/pdf?${params}`, "_blank");
  };

  const handleWhatIfChange = (key: keyof WhatIfForm, value: string) => {
    setWhatIfForm({ ...whatIfForm, [key]: value });
    if (whatIfErrors[key]) setWhatIfErrors({ ...whatIfErrors, [key]: "" });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Market Analysis Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">Explore property market trends and run what-if scenarios.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex shrink-0 items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={exportPdf} className="flex shrink-0 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
            <FileText className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Properties", value: stats.totalProperties.toLocaleString(), icon: Home, color: "bg-blue-50 text-blue-600" },
            { label: "Avg Price", value: formatPrice(stats.avgPrice), icon: DollarSign, color: "bg-green-50 text-green-600" },
            { label: "Price Range", value: `${formatPrice(stats.minPrice)} - ${formatPrice(stats.maxPrice)}`, icon: TrendingUp, color: "bg-yellow-50 text-yellow-600" },
            { label: "Avg School Rating", value: `${stats.avgSchoolRating.toFixed(1)}/10`, icon: GraduationCap, color: "bg-purple-50 text-purple-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5 animate-slideUp">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 text-xs text-gray-500 sm:text-sm">{label}</div>
              <div className="mt-1 text-lg font-bold text-gray-900 sm:text-xl">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-blue-600" /> Price Distribution
          </h3>
          {priceDistData.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priceDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {priceDistData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="flex h-64 items-center justify-center text-gray-400">Loading chart data...</div>}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Building className="h-5 w-5 text-green-600" /> Avg Price by Bedrooms
          </h3>
          {priceByBedsData.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceByBedsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bedrooms" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: any) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => formatPrice(value as number)} />
                  <Bar dataKey="avgPrice" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="flex h-64 items-center justify-center text-gray-400">Loading chart data...</div>}
        </div>
      </div>

      {/* What-If Analysis */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-purple-600" /> What-If Analysis
        </h3>
        <p className="mb-4 text-sm text-gray-600">Enter a base property and see how changes affect the predicted price.</p>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {whatIfFields.map(({ key, label, step, min, max }) => (
            <div key={key}>
              <label htmlFor={key} className="mb-1 block text-xs font-medium text-gray-600">
                {label}
                {whatIfErrors[key] && <span className="ml-1 text-red-500">*</span>}
              </label>
              <input
                id={key}
                type="number"
                step={step}
                min={min}
                max={max}
                value={whatIfForm[key]}
                onChange={(e) => handleWhatIfChange(key, e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1 ${
                  whatIfErrors[key]
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                aria-invalid={!!whatIfErrors[key]}
                aria-describedby={whatIfErrors[key] ? `${key}-error` : undefined}
              />
              {whatIfErrors[key] && (
                <p id={`${key}-error`} className="mt-1 text-xs text-red-600" role="alert">{whatIfErrors[key]}</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={runWhatIf}
          disabled={whatIfLoading}
          className="mt-4 flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {whatIfLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Sparkles className="h-4 w-4" />}
          Run What-If Analysis
        </button>

        {whatIf && (
          <div className="mt-6 overflow-x-auto animate-slideUp">
            <table className="w-full min-w-[400px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Scenario</th>
                  <th className="px-4 py-3">Predicted Price</th>
                  <th className="px-4 py-3">Difference</th>
                  <th className="px-4 py-3">% Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {whatIf.map((r, i) => (
                  <tr key={i} className={`transition hover:bg-gray-50 ${i === 0 ? "bg-blue-50 font-semibold" : ""}`}>
                    <td className="whitespace-nowrap px-4 py-3">{r.scenario}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-green-700">{formatPrice(r.predictedPrice)}</td>
                    <td className={`whitespace-nowrap px-4 py-3 ${r.priceDifference > 0 ? "text-green-600" : r.priceDifference < 0 ? "text-red-600" : ""}`}>
                      {r.priceDifference > 0 ? "+" : ""}{formatPrice(r.priceDifference)}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 ${r.percentageChange > 0 ? "text-green-600" : r.percentageChange < 0 ? "text-red-600" : ""}`}>
                      {r.percentageChange > 0 ? "+" : ""}{r.percentageChange.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Properties Table with Filters */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Filter className="h-5 w-5 text-gray-600" /> Property Listings
          </h3>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <input type="number" placeholder="Min Beds" value={filters.minBedrooms} onChange={(e) => setFilters({ ...filters, minBedrooms: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" aria-label="Minimum bedrooms" />
            <input type="number" placeholder="Max Beds" value={filters.maxBedrooms} onChange={(e) => setFilters({ ...filters, maxBedrooms: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" aria-label="Maximum bedrooms" />
            <input type="number" placeholder="Min Price" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" aria-label="Minimum price" />
            <input type="number" placeholder="Max Price" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" aria-label="Maximum price" />
            <input type="number" placeholder="Min School Rating" step="0.5" value={filters.minSchoolRating} onChange={(e) => setFilters({ ...filters, minSchoolRating: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" aria-label="Minimum school rating" />
            <button onClick={handleFilter} disabled={filterLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
              {filterLoading ? "Loading..." : "Apply Filters"}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                {[
                  { key: "id", label: "ID" },
                  { key: "squareFootage", label: "Sq Ft" },
                  { key: "bedrooms", label: "Beds" },
                  { key: "bathrooms", label: "Baths" },
                  { key: "yearBuilt", label: "Year" },
                  { key: "lotSize", label: "Lot Size" },
                  { key: "schoolRating", label: "School" },
                  { key: "price", label: "Price" },
                ].map(({ key, label }) => (
                  <th key={key} className="cursor-pointer whitespace-nowrap px-4 py-3 transition hover:bg-gray-100" onClick={() => handleSort(key)} aria-sort={sortBy === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                    {label} {sortBy === key && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {properties.map((p) => (
                <tr key={p.id} className="transition hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">{p.id}</td>
                  <td className="whitespace-nowrap px-4 py-3">{p.squareFootage}</td>
                  <td className="whitespace-nowrap px-4 py-3">{p.bedrooms}</td>
                  <td className="whitespace-nowrap px-4 py-3">{p.bathrooms}</td>
                  <td className="whitespace-nowrap px-4 py-3">{p.yearBuilt}</td>
                  <td className="whitespace-nowrap px-4 py-3">{p.lotSize.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3">{p.schoolRating}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-green-700">{formatPrice(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
