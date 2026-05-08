import { fetchTopMarkets } from "./coingecko.js";

const RANDOM_POOL = 500;
const VALID_MODES = new Set(["top", "top500", "random"]);

// Reads ?mode= and ?pool= from the URL.
export function readModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("mode");
  const mode = VALID_MODES.has(raw) ? raw : "top";
  const pool = Number(params.get("pool")) || RANDOM_POOL;
  return { mode, pool };
}

// Fetches and selects the coin set for the requested mode.
// Returns { coins, label } where label is human-readable for the notice.
export async function selectCoins({ mode, pool }) {
  if (mode === "random") {
    const universe = await fetchTopMarkets(pool);
    const sample = shuffle(universe).slice(0, 100);
    return {
      coins: sample,
      label: `Random sample of ${sample.length} coins drawn from today's top ${pool} by market cap.`,
    };
  }
  if (mode === "top500") {
    const coins = await fetchTopMarkets(500);
    return {
      coins,
      label: `Today's top ${coins.length} coins by market cap. Loading takes 2-3 minutes; expect a hairball — read the stats panel for signal.`,
    };
  }
  const coins = await fetchTopMarkets(100);
  return {
    coins,
    label: `Today's top ${coins.length} coins by market cap.`,
  };
}

// Fisher-Yates, in-place on a copy.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
