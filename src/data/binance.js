const BASE = "https://api.binance.com/api/v3";

// Thrown when Binance returns "Invalid symbol" (-1121) — caller should
// fall back to CryptoCompare.
export class BinanceSymbolNotFoundError extends Error {
  constructor(symbol) {
    super(`Binance symbol not found: ${symbol}`);
    this.name = "BinanceSymbolNotFoundError";
    this.symbol = symbol;
  }
}

// One page of klines. Returns up to `limit` candles (max 1000).
// Each candle is normalized to { time, open, high, low, close, volume }
// where `time` is UTC seconds (Lightweight Charts' expected unit).
export async function fetchKlines(symbol, interval, { startTime, endTime, limit = 1000 } = {}) {
  const url = new URL(`${BASE}/klines`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));
  if (startTime != null) url.searchParams.set("startTime", String(startTime));
  if (endTime != null) url.searchParams.set("endTime", String(endTime));

  const res = await fetch(url);
  if (!res.ok) {
    let body = null;
    try { body = await res.json(); } catch { /* ignore */ }
    if (body?.code === -1121) throw new BinanceSymbolNotFoundError(symbol);
    throw new Error(`Binance /klines failed for ${symbol}: ${res.status} ${res.statusText}${body?.msg ? ` — ${body.msg}` : ""}`);
  }
  const raw = await res.json();
  return raw.map(normalizeKline);
}

// Full history, paginated forward via startTime. Forward pagination (rather
// than endTime-backward) aligns with our delta-fetch model — caching layer
// just resumes from `lastBarTime + 1` on subsequent loads.
export async function fetchAllKlines(symbol, interval, { startTime = 0 } = {}) {
  const out = [];
  let cursor = startTime;
  while (true) {
    const page = await fetchKlines(symbol, interval, { startTime: cursor, limit: 1000 });
    if (page.length === 0) break;
    out.push(...page);
    if (page.length < 1000) break;
    cursor = page[page.length - 1].time * 1000 + 1;
  }
  return out;
}

function normalizeKline(k) {
  return {
    time: Math.floor(k[0] / 1000),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  };
}
