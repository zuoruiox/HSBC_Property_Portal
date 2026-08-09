"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  deps?: any[];
}

export function useApi<T>(
  url: string,
  options?: RequestInit & UseApiOptions
): UseApiState<T> & { execute: (body?: any) => Promise<T | null>; refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const immediate = options?.immediate !== false;

  const execute = useCallback(async (body?: any): Promise<T | null> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(options?.headers || {}),
        },
        body: body ? JSON.stringify(body) : options?.body,
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setState({ data, loading: false, error: null });
      return data;
    } catch (err: any) {
      if (err.name === "AbortError") return null;
      setState({ data: null, loading: false, error: err.message });
      return null;
    }
  }, [url, options]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  useEffect(() => {
    if (immediate && !options?.body) {
      execute();
    }
    return () => abortRef.current?.abort();
  }, [immediate, execute]);

  return { ...state, execute, refetch };
}

export function useEstimatorApi() {
  const ESTIMATOR_API = process.env.NEXT_PUBLIC_ESTIMATOR_API || "http://localhost:8001";

  const estimate = useCallback(async (features: any) => {
    const res = await fetch(`${ESTIMATOR_API}/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
    });
    if (!res.ok) throw new Error("Estimation failed");
    return res.json();
  }, []);

  const getHistory = useCallback(async () => {
    const res = await fetch(`${ESTIMATOR_API}/history`);
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
  }, []);

  const clearHistory = useCallback(async () => {
    await fetch(`${ESTIMATOR_API}/history`, { method: "DELETE" });
  }, []);

  return { estimate, getHistory, clearHistory };
}

export function useMarketApi() {
  const MARKET_API = process.env.NEXT_PUBLIC_MARKET_API || "http://localhost:8002";

  const getStats = useCallback(async () => {
    const res = await fetch(`${MARKET_API}/api/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  }, []);

  const getProperties = useCallback(async (filters?: Record<string, any>) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v != null) params.set(k, v);
      });
    }
    const res = await fetch(`${MARKET_API}/api/properties?${params}`);
    if (!res.ok) throw new Error("Failed to fetch properties");
    return res.json();
  }, []);

  const runWhatIf = useCallback(async (features: any) => {
    const res = await fetch(`${MARKET_API}/api/what-if`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
    });
    if (!res.ok) throw new Error("What-if analysis failed");
    return res.json();
  }, []);

  return { getStats, getProperties, runWhatIf };
}
