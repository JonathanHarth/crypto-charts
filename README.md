# Top 100 Crypto — Price History

A browser-only visualization of cryptocurrency price histories, indexed and overlaid on a single log-scale chart. Built to make a specific point: even among the *survivors* — coins that made it into today's top-100 — roughly half are below their starting price, and the median return is near zero. The bull narrative lives almost entirely in the right tail of the distribution.

**Live demo:** https://jonathanharth.github.io/crypto-charts/

## What it does

- Fetches the top 100 (or 500) coins by market cap from CoinGecko.
- Pulls full daily-bar OHLCV history for each from Binance Spot (back to each pair's listing date — for BTC/USDT, that's August 2017).
- Plots every coin as one line, normalized to a price multiplier from its day-zero, on a log y-axis. A line at ×1.0 means the coin is exactly at its starting price; ×10 means 10×; ×0.1 means down 90%.
- Hovering the chart shows the closest line's coin name and current multiplier.
- Below the chart, an analysis panel summarizes how many coins are up vs. down, the median multiplier, the skip-reason breakdown, and a Top 5 / Bottom 5 leaderboard.

## Selection modes

Three modes via the header toggle:

- **Top 100** — today's top 100 by market cap (default).
- **Top 500** — today's top 500. Loads over ~2-3 minutes; the chart becomes a hairball but the stats panel gets richer.
- **Random sample** — 100 coins randomly drawn from today's top 500. The "Reshuffle" button draws a fresh sample.

The "Selection" notice below the chart explains the current mode and reminds you of the survivorship bias: coins that fell out of the top-N over time are not shown, so the data is a "winner's history" by construction.

## Running locally

ES modules with import maps require an `http://` origin — opening `index.html` directly with `file://` won't work.

```bash
python serve.py
```

Then visit http://localhost:8080. `serve.py` is a tiny wrapper around Python's `http.server` that hard-codes the right MIME types (Windows' registry sometimes serves `.js` as `text/plain`, which browsers reject for ES modules).

VS Code's Live Server extension also works.

## Tech stack

No build step. No bundler. No framework. No backend.

- **HTML + plain ES modules**, libraries pulled via `<script type="importmap">` from [esm.sh](https://esm.sh/).
- **[TradingView Lightweight Charts v5](https://github.com/tradingview/lightweight-charts)** (Apache 2.0) for the chart layer.
- **CoinGecko `/coins/markets`** for the coin list and metadata.
- **Binance public klines** (`/api/v3/klines`) for full-history daily OHLCV. No API key required.

## Notes & caveats

- **Survivorship bias is real and large.** This is the central caveat — see the in-app notice. Today's top-100 are not 2018's top-100; many coins from earlier eras have collapsed entirely or fallen out of the ranking and are simply absent here.
- **~5–15% of coins are skipped.** Stablecoins and tokenized treasuries (BUIDL, OUSG, USYC, etc.) are excluded by design. Long-tail alts not listed on Binance USDT (Mantle, Pi, Kaspa, KuCoin, etc.) are skipped too — a `not-on-binance` count appears in the stats panel.
- **Rate limits.** Binance allows 1200 weight/minute per IP for free; the loader paces requests at ~5 starts/sec to stay well under that. CoinGecko's free tier suffices because we hit it only once per page load.

See [crypto-info.md](crypto-info.md) for the full research brief that informed the architecture, including data-source comparisons and rate-limit details.

## License

MIT — see [LICENSE](LICENSE).

Lightweight Charts is Apache 2.0 and requires the TradingView attribution logo on the chart pane (already enabled).
