import { MARKET_API } from "@/lib/api";
import AnalysisDashboard from "./AnalysisDashboard";

async function getInitialData() {
  try {
    const [statsRes, distRes, bedsRes, propsRes] = await Promise.all([
      fetch(`${MARKET_API}/api/stats`, { cache: "no-store" }),
      fetch(`${MARKET_API}/api/price-distribution`, { cache: "no-store" }),
      fetch(`${MARKET_API}/api/price-by-bedrooms`, { cache: "no-store" }),
      fetch(`${MARKET_API}/api/properties?sortBy=id&sortDir=asc`, { cache: "no-store" }),
    ]);

    if (!statsRes.ok || !distRes.ok || !bedsRes.ok || !propsRes.ok) {
      throw new Error("Failed to fetch initial data");
    }

    const [stats, priceDistribution, priceByBedrooms, properties] = await Promise.all([
      statsRes.json(),
      distRes.json(),
      bedsRes.json(),
      propsRes.json(),
    ]);

    return { stats, priceDistribution, priceByBedrooms, properties };
  } catch {
    return { stats: null, priceDistribution: null, priceByBedrooms: null, properties: [] };
  }
}

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const initialData = await getInitialData();
  return (
    <div className="page-transition">
      <AnalysisDashboard initialData={initialData} />
    </div>
  );
}
