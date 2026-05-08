import { selectCoins, readModeFromUrl } from "./data/selection.js";
import { loadHistoryStaged } from "./data/loader.js";
import { createPriceChart } from "./render/chart.js";
import { renderAnalysis } from "./render/analysis.js";

const statusEl = document.getElementById("status");
const setStatus = (msg) => (statusEl.textContent = msg);

function initModeControls(mode) {
  for (const a of document.querySelectorAll(".mode-controls a")) {
    if (a.dataset.mode === mode) a.classList.add("active");
  }
  const reshuffle = document.getElementById("reshuffle");
  if (mode === "random") {
    reshuffle.hidden = false;
    reshuffle.addEventListener("click", () => window.location.reload());
  }
}

function setNotice(label, mode) {
  const el = document.getElementById("selection-notice");
  const survivorship =
    "<strong>Survivorship-bias warning:</strong> coins that fell out of this list at some point in the past are not shown — every series here is, by definition, one that survived.";
  el.innerHTML = `<strong>Selection:</strong> ${label} ${survivorship}`;
  if (mode === "random") {
    el.innerHTML += ` Click <em>Reshuffle</em> to draw a fresh sample.`;
  }
}

async function main() {
  const { mode, pool } = readModeFromUrl();
  initModeControls(mode);

  setStatus(`Fetching coin list (${mode})…`);
  const { coins, label } = await selectCoins({ mode, pool });
  setNotice(label, mode);

  setStatus(`Loaded ${coins.length} coins. Building chart…`);
  const chart = createPriceChart(
    document.getElementById("chart"),
    document.getElementById("tooltip"),
  );
  const statsEl = document.getElementById("stats");
  const leaderboardEl = document.getElementById("leaderboards");

  let loaded = 0;
  let skipped = 0;
  const reasons = new Map();
  const setStatusLine = () => setStatus(
    `${loaded} loaded · ${skipped} skipped${skipped ? ` (${[...reasons].map(([k, v]) => `${k}:${v}`).join(", ")})` : ""}`,
  );
  const refreshStats = () => renderAnalysis(statsEl, leaderboardEl, chart.snapshot(), { skipped, reasons });

  await loadHistoryStaged(coins, {
    onLoaded: (coin, klines) => {
      chart.addCoinSeries(coin, klines);
      loaded++;
      setStatusLine();
      chart.fitContent();
      refreshStats();
    },
    onSkipped: (_coin, reason) => {
      skipped++;
      reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
      setStatusLine();
      refreshStats();
    },
  });

  chart.fitContent();
  refreshStats();
  setStatus(`Done. ${loaded} series rendered, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  setStatus(`Error: ${err.message}`);
});
