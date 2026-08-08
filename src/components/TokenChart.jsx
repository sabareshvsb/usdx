"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const CHART_URL = "/api/token-chart";
const WIDTH = 720;
const HEIGHT = 380;
const PAD_LEFT = 64;
const PAD_RIGHT = 12;
const PAD_TOP = 14;
const PAD_BOTTOM = 24;

const UP = "#7fffd4";
const DOWN = "#ff7aa8";

function formatDate(ts, timeframe) {
  const date = new Date(ts * 1000);
  return timeframe === "day"
    ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit" });
}

function formatPrice(value) {
  if (value >= 100) return value.toFixed(2);
  if (value >= 1) return value.toFixed(3);
  return value.toFixed(5);
}

function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

export default function TokenChart() {
  const [containerRef, containerWidth] = useElementWidth();
  const [timeframe, setTimeframe] = useState("day");
  const [candles, setCandles] = useState(null);
  const [error, setError] = useState("");
  const [hover, setHover] = useState(null);
  const svgWidth = Math.max(containerWidth || 360, 320);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`${CHART_URL}?timeframe=${timeframe}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Chart data unavailable.");
        if (!cancelled) setCandles(data.candles || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [timeframe]);

  const layout = useMemo(() => {
    if (!candles || candles.length === 0) return null;
    const plotW = svgWidth - PAD_LEFT - PAD_RIGHT;
    const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
    let min = Infinity;
    let max = -Infinity;
    for (const c of candles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    }
    const pad = (max - min) * 0.08 || max * 0.01 || 1;
    min -= pad;
    max += pad;
    const yFor = (price) => PAD_TOP + ((max - price) / (max - min)) * plotH;
    const slot = plotW / candles.length;
    const candleW = Math.max(Math.min(slot * 0.62, 14), 2);
    return { plotW, plotH, min, max, yFor, slot, candleW };
  }, [candles, svgWidth]);

  const priceGrid = useMemo(() => {
    if (!layout) return [];
    const lines = 6;
    const out = [];
    for (let i = 0; i < lines; i += 1) {
      const price = layout.min + ((layout.max - layout.min) * i) / (lines - 1);
      out.push({ price, y: layout.yFor(price) });
    }
    return out;
  }, [layout]);

  if (error) {
    return (
      <div className="token-chart glass-panel">
        <div className="token-chart-head">
          <p className="eyebrow"><span /> USDX / PRICE CHART</p>
          <div className="token-chart-toggle">
            {["hour", "day"].map((tf) => (
              <button
                type="button"
                key={tf}
                className={timeframe === tf ? "is-active" : ""}
                onClick={() => {
                  setTimeframe(tf);
                  setCandles(null);
                  setError("");
                  setHover(null);
                }}
              >
                {tf === "hour" ? "1H" : "1D"}
              </button>
            ))}
          </div>
        </div>
        <p className="token-chart-error">Price chart unavailable. Please try again.</p>
      </div>
    );
  }

  const hovered = hover !== null && candles && candles[hover] ? candles[hover] : null;

  return (
    <div className="token-chart glass-panel" ref={containerRef}>
      <div className="token-chart-head">
        <p className="eyebrow"><span /> USDX / PRICE CHART</p>
        <div className="token-chart-toggle">
          {["hour", "day"].map((tf) => (
            <button
              type="button"
              key={tf}
              className={timeframe === tf ? "is-active" : ""}
              onClick={() => {
                setTimeframe(tf);
                setCandles(null);
                setError("");
                setHover(null);
              }}
            >
              {tf === "hour" ? "1H" : "1D"}
            </button>
          ))}
        </div>
      </div>

      {!candles || !layout ? (
        <div className="token-chart-loading">Loading candles…</div>
      ) : (
        <>
          <div className="token-chart-pricebar">
            <strong>{hovered ? `$${formatPrice(hovered.close)}` : candles.length ? `$${formatPrice(candles[candles.length - 1].close)}` : "—"}</strong>
            {hovered ? <span>{formatDate(hovered.timestamp, timeframe)}</span> : <span>{candles.length} CANDLES</span>}
          </div>

          <svg
            viewBox={`0 0 ${svgWidth} ${HEIGHT}`}
            className="token-chart-svg"
            role="img"
            aria-label={`USDXSMART ${timeframe} candlestick chart`}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="token-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#57f4ff" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#57f4ff" stopOpacity="0" />
              </linearGradient>
            </defs>

            {priceGrid.map(({ price, y }) => (
              <g key={price}>
                <line x1={PAD_LEFT} y1={y} x2={svgWidth - PAD_RIGHT} y2={y} stroke="rgba(212,225,255,0.07)" strokeWidth="1" />
                <text x={PAD_LEFT - 8} y={y + 4} textAnchor="end" className="token-chart-axis">{formatPrice(price)}</text>
              </g>
            ))}

            {candles.map((c, index) => {
              const x = PAD_LEFT + index * layout.slot + layout.slot / 2;
              const up = c.close >= c.open;
              const color = up ? UP : DOWN;
              const bodyTop = layout.yFor(Math.max(c.open, c.close));
              const bodyBottom = layout.yFor(Math.min(c.open, c.close));
              const bodyH = Math.max(bodyBottom - bodyTop, 1);
              const wickTop = layout.yFor(c.high);
              const wickBottom = layout.yFor(c.low);
              return (
                <g key={`${c.timestamp}-${index}`} onMouseEnter={() => setHover(index)}>
                  <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH} fill={color} opacity={hover === index ? 1 : 0.92} rx="1" />
                  <line x1={x} y1={wickTop} x2={x} y2={bodyTop} stroke={color} strokeWidth="1" />
                  <line x1={x} y1={bodyBottom} x2={x} y2={wickBottom} stroke={color} strokeWidth="1" />
                </g>
              );
            })}

            {hovered && layout ? (
              <g>
                <line x1={PAD_LEFT + hover * layout.slot + layout.slot / 2} y1={PAD_TOP} x2={PAD_LEFT + hover * layout.slot + layout.slot / 2} y2={PAD_TOP + layout.plotH} stroke="rgba(87,244,255,0.5)" strokeDasharray="3 3" />
                <line x1={PAD_LEFT} y1={layout.yFor(hovered.close)} x2={svgWidth - PAD_RIGHT} y2={layout.yFor(hovered.close)} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" />
              </g>
            ) : null}

            {candles.length ? (
              <g>
                {[0, Math.floor(candles.length / 2), candles.length - 1].map((index) => (
                  <text key={index} x={PAD_LEFT + index * layout.slot + layout.slot / 2} y={HEIGHT - 8} textAnchor="middle" className="token-chart-axis">
                    {formatDate(candles[index].timestamp, timeframe)}
                  </text>
                ))}
              </g>
            ) : null}
          </svg>

          <div className="token-chart-legend">
            <span><i style={{ background: UP }} /> Up</span>
            <span><i style={{ background: DOWN }} /> Down</span>
            <a href="https://dexscreener.com/base/0x6f15abbe3e968fef47a26ad8a244f843c717ff84" target="_blank" rel="noreferrer">Open on DexScreener ↗</a>
          </div>
        </>
      )}
    </div>
  );
}
