// Optional CoinGecko Demo API key, read from localStorage.
// Set in DevTools: localStorage.setItem("cgDemoKey", "CG-xxxxxxxx")
// Without a key, the public tier still works for the single /coins/markets
// call we make per page load — the key just stabilizes the rate limit.
export function getCoinGeckoDemoKey() {
  try {
    return localStorage.getItem("cgDemoKey") || null;
  } catch {
    return null;
  }
}

// Returns headers + URL params for an authenticated CoinGecko request.
// If no key is set, returns empty header/param objects (public mode).
export function coinGeckoAuth() {
  const key = getCoinGeckoDemoKey();
  if (!key) return { headers: {}, params: {} };
  return {
    headers: { "x-cg-demo-api-key": key },
    params: { x_cg_demo_api_key: key },
  };
}
