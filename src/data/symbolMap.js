// Maps CoinGecko coin metadata to Binance Spot symbols.
//
// Default rule: `${symbol.toUpperCase()}USDT` (e.g. "btc" → "BTCUSDT").
// The default works for ~85-95% of the top-100. The override table below
// captures the rest. Grow it whenever the staged loader logs a failed
// symbol — don't try to enumerate edge cases up front.

// CoinGecko id → Binance symbol, OR null to skip Binance entirely
// (caller should then fall back to CryptoCompare or treat as unavailable).
const OVERRIDES = {
  // Stablecoins — there is no meaningful price chart, render as flat 1.0.
  tether: null,
  "usd-coin": null,
  dai: null,
  "true-usd": null,
  "first-digital-usd": null,
  "ethena-usde": null,
  "paypal-usd": null,
  // Wrapped / liquid-staking derivatives — track the underlying via fallback,
  // not via a synthetic Binance pair.
  "wrapped-bitcoin": null,
  "staked-ether": null,
  "wrapped-steth": null,
};

// CoinGecko ids treated as a flat 1.0 USD line (chart still gets a series,
// but no fetching needed). Currently a subset of OVERRIDES that are pegged.
export const STABLECOINS = new Set([
  "tether",
  "usd-coin",
  "dai",
  "true-usd",
  "first-digital-usd",
  "ethena-usde",
  "paypal-usd",
]);

// Returns:
//   { kind: "binance", symbol: "BTCUSDT" }   — fetch from Binance
//   { kind: "stablecoin" }                    — render as flat 1.0
//   { kind: "fallback" }                      — try CryptoCompare instead
export function resolveSource(coin) {
  if (STABLECOINS.has(coin.id)) return { kind: "stablecoin" };
  if (coin.id in OVERRIDES) {
    const mapped = OVERRIDES[coin.id];
    return mapped == null ? { kind: "fallback" } : { kind: "binance", symbol: mapped };
  }
  return { kind: "binance", symbol: `${coin.symbol.toUpperCase()}USDT` };
}
