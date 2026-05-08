import { fetchAllKlines, BinanceSymbolNotFoundError } from "./binance.js";
import { resolveSource } from "./symbolMap.js";

const EAGER_COUNT = 10;
const LAZY_INTERVAL_MS = 200; // ~5 starts/sec

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Loads daily kline history for every coin in `coins`, in two phases:
//   1. Top 10 (by market cap rank) in parallel, awaited.
//   2. Remaining coins paced ~5 starts/sec, fire-and-forget.
//
// `onLoaded(coin, klines)` is called for each successful fetch.
// `onSkipped(coin, reason)` is called for stablecoins / fallbacks (Stage 2)
// and any per-coin failures so the UI can render a placeholder.
//
// Returns a Promise that resolves when every coin has settled (success or
// failure). The eager top-10 is awaited inline so the UI is interactive
// quickly; the rest fills in over ~20-30s.
export async function loadHistoryStaged(coins, { onLoaded, onSkipped } = {}) {
  const sorted = [...coins].sort((a, b) => a.market_cap_rank - b.market_cap_rank);
  const eager = sorted.slice(0, EAGER_COUNT);
  const lazy = sorted.slice(EAGER_COUNT);

  await Promise.all(eager.map((c) => loadOne(c, onLoaded, onSkipped)));

  const lazyPromises = [];
  for (const coin of lazy) {
    await sleep(LAZY_INTERVAL_MS);
    lazyPromises.push(loadOne(coin, onLoaded, onSkipped));
  }
  await Promise.allSettled(lazyPromises);
}

async function loadOne(coin, onLoaded, onSkipped) {
  const src = resolveSource(coin);
  if (src.kind === "stablecoin") {
    onSkipped?.(coin, "stablecoin");
    return;
  }
  if (src.kind === "fallback") {
    // CryptoCompare path is wired up in Stage 2 (todo #11).
    onSkipped?.(coin, "fallback-pending");
    return;
  }
  try {
    const klines = await fetchAllKlines(src.symbol, "1d");
    if (klines.length === 0) {
      onSkipped?.(coin, "empty");
      return;
    }
    onLoaded?.(coin, klines);
  } catch (err) {
    // Binance returns 400 with no CORS header for unknown symbols, so
    // fetch() throws TypeError before we can read code -1121. Treat any
    // TypeError on a klines call as "symbol not on Binance" — the only
    // other thing it would mean is a total network outage, in which case
    // every coin would fail uniformly and the user has bigger problems.
    if (err instanceof BinanceSymbolNotFoundError || err instanceof TypeError) {
      onSkipped?.(coin, "not-on-binance");
    } else {
      console.warn(`failed to load ${coin.id}:`, err);
      onSkipped?.(coin, "error");
    }
  }
}
