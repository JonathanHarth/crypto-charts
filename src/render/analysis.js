// Renders summary stats and best/worst leaderboards into the analysis panel.
// `entries` is from chart.snapshot(): [{ coin, color, multiplier }].
export function renderAnalysis(statsEl, leaderboardEl, entries, { skipped, reasons }) {
  if (entries.length === 0) {
    statsEl.textContent = "Waiting for data…";
    leaderboardEl.innerHTML = "";
    return;
  }

  const sorted = [...entries].sort((a, b) => b.multiplier - a.multiplier);
  const up = entries.filter((e) => e.multiplier >= 1).length;
  const down = entries.length - up;
  const median = sorted[Math.floor(sorted.length / 2)].multiplier;

  const cards = [
    { label: "Rendered", value: String(entries.length), sub: `${skipped} skipped` },
    { label: "Up since start", value: String(up), valueClass: "up", sub: `${pct(up / entries.length)} of rendered` },
    { label: "Down since start", value: String(down), valueClass: "down", sub: `${pct(down / entries.length)} of rendered` },
    { label: "Median multiplier", value: fmtMul(median), sub: `${pct(median - 1)} median return` },
  ];
  if (reasons && reasons.size > 0) {
    cards.push({
      label: "Skip reasons",
      value: String(skipped),
      sub: [...reasons].map(([k, v]) => `${v} ${k}`).join(" · "),
    });
  }
  statsEl.innerHTML = cards.map(renderCard).join("");

  const top = sorted.slice(0, 5);
  const bottom = sorted.slice(-5).reverse();
  leaderboardEl.innerHTML = `
    ${renderBoard("Top 5 — best performers", "up", top, false)}
    ${renderBoard("Bottom 5 — worst performers", "down", bottom, true)}
  `;
}

function renderCard({ label, value, valueClass = "", sub = "" }) {
  return `
    <div class="stat">
      <div class="stat-label">${label}</div>
      <div class="stat-value ${valueClass}">${value}</div>
      ${sub ? `<div class="stat-sub">${sub}</div>` : ""}
    </div>
  `;
}

function renderBoard(title, headerClass, rows, isLoss) {
  const valueClass = isLoss ? "down" : "up";
  return `
    <div class="leaderboard">
      <h3 class="${headerClass}">${title}</h3>
      <table>
        <tbody>
          ${rows.map((r, i) => `
            <tr>
              <td class="rank">${i + 1}</td>
              <td class="swatch-cell"><span class="swatch" style="background:${r.color}"></span></td>
              <td class="symbol">${r.coin.symbol.toUpperCase()}</td>
              <td class="name" title="${escapeHtml(r.coin.name)}">${escapeHtml(r.coin.name)}</td>
              <td class="value ${valueClass}">${fmtMul(r.multiplier)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function fmtMul(m) {
  if (m >= 100) return `×${m.toFixed(0)}`;
  if (m >= 10) return `×${m.toFixed(1)}`;
  if (m >= 0.1) return `×${m.toFixed(2)}`;
  return `×${m.toFixed(3)}`;
}

function pct(frac) {
  const sign = frac > 0 ? "+" : "";
  return `${sign}${(frac * 100).toFixed(1)}%`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
