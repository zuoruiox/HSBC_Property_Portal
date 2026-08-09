const ESTIMATOR_API = process.env.NEXT_PUBLIC_ESTIMATOR_API || 'http://localhost:8001';
const MARKET_API = process.env.NEXT_PUBLIC_MARKET_API || 'http://localhost:8002';
const ML_API = process.env.NEXT_PUBLIC_ML_API || 'http://localhost:8000';

export async function fetchEstimator(path: string, options?: RequestInit) {
  const res = await fetch(`${ESTIMATOR_API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Estimator API error: ${res.status}`);
  return res.json();
}

export async function fetchMarket(path: string, options?: RequestInit) {
  const res = await fetch(`${MARKET_API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Market API error: ${res.status}`);
  return res.json();
}

export { ESTIMATOR_API, MARKET_API, ML_API };
