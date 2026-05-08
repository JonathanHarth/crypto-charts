import { createChart, LineSeries, ColorType } from "lightweight-charts";

// One overview chart with one normalized line series per coin.
// Each series plots `price / firstPrice` (multiplier from day-zero) on a
// log price scale, so equal screen-space corresponds to equal % return.
export function createPriceChart(container, tooltipEl) {
  const chart = createChart(container, {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: "#161b22" },
      textColor: "#e6edf3",
      attributionLogo: true,
    },
    grid: {
      vertLines: { color: "#232a34" },
      horzLines: { color: "#232a34" },
    },
    rightPriceScale: {
      mode: 1, // PriceScaleMode.Logarithmic
      borderColor: "#232a34",
    },
    timeScale: {
      borderColor: "#232a34",
      timeVisible: false,
      secondsVisible: false,
    },
    crosshair: { mode: 0 },
  });

  // Series → coin metadata, used by the crosshair tooltip.
  const coinBySeries = new Map();
  const seriesByCoinId = new Map();

  function addCoinSeries(coin, klines) {
    if (klines.length === 0) return;
    const firstPrice = klines[0].close;
    if (!Number.isFinite(firstPrice) || firstPrice <= 0) return;

    const data = klines.map((k) => ({
      time: k.time,
      value: k.close / firstPrice,
    }));

    const color = colorForRank(coin.market_cap_rank);
    const series = chart.addSeries(LineSeries, {
      color,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    series.setData(data);
    coinBySeries.set(series, { coin, color });
    seriesByCoinId.set(coin.id, series);
  }

  // Show the coin name + multiplier of the series closest to the cursor.
  if (tooltipEl) {
    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time || param.seriesData.size === 0) {
        tooltipEl.hidden = true;
        return;
      }
      let closest = null;
      let minDist = Infinity;
      for (const [series, point] of param.seriesData) {
        const y = series.priceToCoordinate(point.value);
        if (y == null) continue;
        const dist = Math.abs(y - param.point.y);
        if (dist < minDist) {
          minDist = dist;
          closest = { series, point };
        }
      }
      if (!closest) {
        tooltipEl.hidden = true;
        return;
      }
      const meta = coinBySeries.get(closest.series);
      tooltipEl.innerHTML = `<span class="swatch" style="background:${meta.color}"></span>${meta.coin.name} <span style="color:var(--text-dim)">(${meta.coin.symbol.toUpperCase()})</span> · ×${closest.point.value.toFixed(2)}`;
      tooltipEl.style.left = `${param.point.x}px`;
      tooltipEl.style.top = `${param.point.y}px`;
      tooltipEl.hidden = false;
    });
  }

  function fitContent() {
    chart.timeScale().fitContent();
  }

  // Final multiplier of every loaded series, paired with its coin metadata.
  // Used by the analysis section.
  function snapshot() {
    const out = [];
    for (const [series, meta] of coinBySeries) {
      const data = series.data();
      if (data.length === 0) continue;
      out.push({
        coin: meta.coin,
        color: meta.color,
        multiplier: data[data.length - 1].value,
      });
    }
    return out;
  }

  return {
    chart,
    addCoinSeries,
    fitContent,
    snapshot,
    seriesCount: () => seriesByCoinId.size,
  };
}

function colorForRank(rank) {
  // Golden-angle hue spacing keeps adjacent ranks visually distinct.
  const hue = ((rank ?? 0) * 137.508) % 360;
  return `hsl(${hue.toFixed(1)}, 65%, 60%)`;
}
