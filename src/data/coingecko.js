import { coinGeckoAuth } from "../config.js";

const BASE = "https://api.coingecko.com/api/v3";

// Returns the top-N coins by market cap, paginated. One page = up to 250
// coins; we issue ceil(n/250) calls and concatenate. Each entry has: id,
// symbol, name, image, current_price, market_cap, market_cap_rank, ath,
// ath_date, atl, atl_date, plus price_change_percentage_{24h,7d,30d}.
export async function fetchTopMarkets(n = 100) {
  const { headers, params } = coinGeckoAuth();
  const perPage = 250;
  const pages = Math.ceil(n / perPage);
  const out = [];

  for (let page = 1; page <= pages; page++) {
    const url = new URL(`${BASE}/coins/markets`);
    const query = {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: String(Math.min(perPage, n - out.length)),
      page: String(page),
      sparkline: "false",
      price_change_percentage: "24h,7d,30d",
      ...params,
    };
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`CoinGecko /coins/markets failed: ${res.status} ${res.statusText}`);
    }
    const batch = await res.json();
    out.push(...batch);
    if (batch.length < perPage) break;
  }
  return out.slice(0, n);
}
