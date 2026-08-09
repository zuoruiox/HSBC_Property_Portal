"use client";

import { useState, useEffect } from "react";
import { MARKET_API } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import {
  BarChart3, TrendingUp, Filter, Download, Sparkles,
  Home, DollarSign, Building, GraduationCap
} from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

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

const formatPrice = (p: number) => `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function AnalysisPage() {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [priceDist, setPriceDist] = useState<any>(null);
  const [priceByBeds, setPriceByBeds] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState({ minBedrooms: "", maxBedrooms: "", minPrice: "", maxPrice: "", minSchoolRating: "" });
  const [sortBy, setSortBy] = useState("price");
  const [sortDir, setSortDir] = useState("asc");
  const [whatIf, setWhatIf] = useState<WhatIfResult[] | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfForm, setWhatIfForm] = useState({
    squareFootage: 1800, bedrooms: 3, bathrooms: 2, yearBuilt: 2000,
    lotSize: 7500, distanceToCityCenter: 5, schoolRating: 8,
  });

  useEffect(() => {
    fetch(`${MARKET_API}/api/stats`).then(r => r.json()).then(setStats).catch(() => {});
    fetch(`${MARKET_API}/api/price-distribution`).then(r => r.json()).then(setPriceDist).catch(() => {});
    fetch(`${MARKET_API}/api/price-by-bedrooms`).then(r => r.json()).then(setPriceByBeds).catch(() => {});
    loadProperties();
  }, []);

  const loadProperties = (f = filters, sb = sortBy, sd = sortDir) => {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set("sortBy", sb);
    params.set("sortDir", sd);
    fetch(`${MARKET_API}/api/properties?${params}`)
      .then(r => r.json())
      .then(setProperties)
      .catch(() => {});
  };

  const handleFilter = () => loadProperties(filters, sortBy, sortDir);

  const handleSort = (col: string) => {
    const newDir = sortBy === col && sortDir === "asc" ? "desc" : "asc";
    setSortBy(col);
    setSortDir(newDir);
    loadProperties(filters, col, newDir);
  };

  const runWhatIf = async () => {
    setWhatIfLoading(true);
    try {
      const res = await fetch(`${MARKET_API}/api/what-if`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(whatIfForm),
      });
      setWhatIf(await res.json());
    } catch { /* ignore */ }
    setWhatIfLoading(false);
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    window.open(`${MARKET_API}/api/export/csv?${params}`, "_blank");
  };

  const priceDistData = priceDist ? Object.entries(priceDist.distribution as Record<string, number>).map(([name, value]) => ({ name, value })) : [];
  const priceByBedsData = priceByBeds ? Object.entries(priceByBeds.data as Record<string, number>).map(([bedrooms, avgPrice]) => ({ bedrooms: `${bedrooms} BR`, avgPrice: Math.round(avgPrice) })) : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Market Analysis Dashboard</h1>
          <p className="mt-1 text-gray-600">Explore property market trends and run what-if scenarios.</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Properties", value: stats.totalProperties.toLocaleString(), icon: Home, color: "bg-blue-50 text-blue-600" },
            { label: "Avg Price", value: formatPrice(stats.avgPrice), icon: DollarSign, color: "bg-green-50 text-green-600" },
            { label: "Price Range", value: `${formatPrice(stats.minPrice)} - ${formatPrice(stats.maxPrice)}`, icon: TrendingUp, color: "bg-yellow-50 text-yellow-600" },
            { label: "Avg School Rating", value: `${stats.avgSchoolRating.toFixed(1)}/10`, icon: GraduationCap, color: "bg-purple-50 text-purple-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm text-gray-500">{label}</div>
              <div className="mt-1 text-xl font-bold text-gray-900">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-blue-600" /> Price Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={priceDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {priceDistData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Building className="h-5 w-5 text-green-600" /> Avg Price by Bedrooms
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priceByBedsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bedrooms" />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatPrice(value)} />
              <Bar dataKey="avgPrice" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* What-If Analysis */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-purple-600" /> What-If Analysis
        </h3>
        <p className="mb-4 text-sm text-gray-600">Enter a base property and see how changes affect the predicted price.</p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { key: "squareFootage", label: "Square Footage", step: 100 },
            { key: "bedrooms", label: "Bedrooms", step: 1 },
            { key: "bathrooms", label: "Bathrooms", step: 0.5 },
            { key: "yearBuilt", label: "Year Built", step: 1 },
            { key: "lotSize", label: "Lot Size", step: 100 },
            { key: "distanceToCityCenter", label: "Distance to City (mi)", step: 0.5 },
            { key: "schoolRating", label: "School Rating", step: 0.5 },
          ].map(({ key, label, step }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
              <input
                type="number"
                step={step}
                value={(whatIfForm as any)[key]}
                onChange={(e) => setWhatIfForm({ ...whatIfForm, [key]: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        <button
          onClick={runWhatIf}
          disabled={whatIfLoading}
          className="mt-4 flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {whatIfLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Sparkles className="h-4 w-4" />}
          Run What-If Analysis
        </button>

        {whatIf && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
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
                  <tr key={i} className={i === 0 ? "bg-blue-50 font-semibold" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3">{r.scenario}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{formatPrice(r.predictedPrice)}</td>
                    <td className={`px-4 py-3 ${r.priceDifference > 0 ? "text-green-600" : r.priceDifference < 0 ? "text-red-600" : ""}`}>
                      {r.priceDifference > 0 ? "+" : ""}{formatPrice(r.priceDifference)}
                    </td>
                    <td className={`px-4 py-3 ${r.percentageChange > 0 ? "text-green-600" : r.percentageChange < 0 ? "text-red-600" : ""}`}>
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
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Filter className="h-5 w-5 text-gray-600" /> Property Listings
          </h3>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <input type="number" placeholder="Min Beds" value={filters.minBedrooms} onChange={(e) => setFilters({ ...filters, minBedrooms: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input type="number" placeholder="Max Beds" value={filters.maxBedrooms} onChange={(e) => setFilters({ ...filters, maxBedrooms: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input type="number" placeholder="Min Price" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input type="number" placeholder="Max Price" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input type="number" placeholder="Min School Rating" step="0.5" value={filters.minSchoolRating} onChange={(e) => setFilters({ ...filters, minSchoolRating: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <button onClick={handleFilter} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Apply Filters
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
                  <th key={key} className="cursor-pointer px-4 py-3 hover:bg-gray-100" onClick={() => handleSort(key)}>
                    {label} {sortBy === key && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{p.id}</td>
                  <td className="px-4 py-3">{p.squareFootage}</td>
                  <td className="px-4 py-3">{p.bedrooms}</td>
                  <td className="px-4 py-3">{p.bathrooms}</td>
                  <td className="px-4 py-3">{p.yearBuilt}</td>
                  <td className="px-4 py-3">{p.lotSize.toLocaleString()}</td>
                  <td className="px-4 py-3">{p.schoolRating}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">{formatPrice(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
