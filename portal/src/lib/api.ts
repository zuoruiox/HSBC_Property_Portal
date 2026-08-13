// Server-side API URLs (used in Server Components, runs inside Docker network)
const SERVER_ESTIMATOR_API = process.env.SERVER_ESTIMATOR_API || 'http://property-estimator:8001';
const SERVER_MARKET_API = process.env.SERVER_MARKET_API || 'http://market-analysis:8002';
const SERVER_ML_API = process.env.SERVER_ML_API || 'http://ml-api:8000';

// Client-side API URLs (used in Client Components, runs in browser)
const CLIENT_ESTIMATOR_API = process.env.NEXT_PUBLIC_ESTIMATOR_API || 'http://localhost:8001';
const CLIENT_MARKET_API = process.env.NEXT_PUBLIC_MARKET_API || 'http://localhost:8002';
const CLIENT_ML_API = process.env.NEXT_PUBLIC_ML_API || 'http://localhost:8000';

// Detect if running on server or client
const isServer = typeof window === 'undefined';

export const ESTIMATOR_API = isServer ? SERVER_ESTIMATOR_API : CLIENT_ESTIMATOR_API;
export const MARKET_API = isServer ? SERVER_MARKET_API : CLIENT_MARKET_API;
export const ML_API = isServer ? SERVER_ML_API : CLIENT_ML_API;

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
