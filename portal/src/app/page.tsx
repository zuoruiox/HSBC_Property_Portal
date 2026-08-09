import Link from "next/link";
import { Calculator, BarChart3, TrendingUp, Building2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-16 text-white">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Property Intelligence Platform
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-blue-100">
          Estimate property values using machine learning and explore market trends
          with interactive analytics dashboards.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/estimator"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
          >
            <Calculator className="h-5 w-5" />
            Estimate Property Value
          </Link>
          <Link
            href="/analysis"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-white px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            <BarChart3 className="h-5 w-5" />
            Market Analysis
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Calculator className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Property Value Estimator</h2>
          <p className="mt-2 text-sm text-gray-600">
            Input property features and get instant price predictions powered by a
            linear regression model trained on real housing data.
          </p>
          <ul className="mt-4 space-y-1 text-sm text-gray-500">
            <li>• Single & batch predictions</li>
            <li>• Estimation history tracking</li>
            <li>• Side-by-side comparison view</li>
            <li>• Visual charts of results</li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Market Analysis</h2>
          <p className="mt-2 text-sm text-gray-600">
            Explore interactive dashboards with market statistics, price distributions,
            and segment analysis.
          </p>
          <ul className="mt-4 space-y-1 text-sm text-gray-500">
            <li>• Interactive data visualizations</li>
            <li>• Filterable property segments</li>
            <li>• What-if scenario analysis</li>
            <li>• CSV/PDF data export</li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">ML Model</h2>
          <p className="mt-2 text-sm text-gray-600">
            A scikit-learn linear regression model with R² score of 0.98,
            deployed as a containerized FastAPI service.
          </p>
          <ul className="mt-4 space-y-1 text-sm text-gray-500">
            <li>• 7 property features</li>
            <li>• REST API with Swagger docs</li>
            <li>• Health & model-info endpoints</li>
            <li>• Docker containerized</li>
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Building2 className="h-6 w-6 text-blue-600" />
          Architecture Overview
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { name: "ML Model API", tech: "FastAPI / scikit-learn", port: ":8000", color: "bg-red-50 border-red-200" },
            { name: "Property Estimator", tech: "FastAPI (Python)", port: ":8001", color: "bg-blue-50 border-blue-200" },
            { name: "Market Analysis", tech: "Spring Boot (Java)", port: ":8002", color: "bg-green-50 border-green-200" },
            { name: "Web Portal", tech: "Next.js 15 / React", port: ":3000", color: "bg-purple-50 border-purple-200" },
          ].map((svc) => (
            <div key={svc.name} className={`rounded-lg border p-4 ${svc.color}`}>
              <div className="font-semibold text-gray-900">{svc.name}</div>
              <div className="text-sm text-gray-600">{svc.tech}</div>
              <div className="mt-1 font-mono text-xs text-gray-500">{svc.port}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
