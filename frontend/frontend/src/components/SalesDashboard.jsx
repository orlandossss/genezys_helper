import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { fetchSalesStats } from "../services/api";

// ── Color maps ────────────────────────────────────────────────────────────────

const RARITY_COLOR = {
  Epic:      "#ffd54f",
  Rare:      "#a78bfa",
  Limited:   "#5c9eff",
  Legendary: "#e8f4ff",
  Common:    "#607090",
};

const CHART_PALETTE = [
  "#00e5ff", "#ff2d78", "#ffc300", "#00ff88",
  "#a78bfa", "#ff3b55", "#5c9eff", "#ffd54f",
];

function rarityColor(rarity) {
  if (!rarity) return CHART_PALETTE[0];
  const key = rarity.charAt(0).toUpperCase() + rarity.slice(1).toLowerCase();
  return RARITY_COLOR[key] ?? CHART_PALETTE[0];
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function NeonTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="chart-tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? p.fill ?? "#00e5ff" }}>
          {p.name}: <strong>{valueFormatter ? valueFormatter(p.value, p.name) : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, accent }) {
  return (
    <div className="kpi-card" style={{ "--kpi-accent": accent }}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
    </div>
  );
}

// ── Chart section wrapper ─────────────────────────────────────────────────────

function ChartPanel({ title, children, wide }) {
  return (
    <div className={`chart-panel${wide ? " chart-panel--wide" : ""}`}>
      <h3 className="chart-panel-title">{title}</h3>
      {children}
    </div>
  );
}

// ── Custom donut label ────────────────────────────────────────────────────────

function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#07070f" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700} fontFamily="Fira Code">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2);
}

function fmtCoins(n) {
  return `${fmt(n)} ◈`;
}

// ── Day range selector ────────────────────────────────────────────────────────

const DAY_OPTIONS = [7, 30, 90, 365];

// ── Main component ────────────────────────────────────────────────────────────

export default function SalesDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [days, setDays]     = useState(30);

  const load = useCallback(async (d) => {
    setLoading(true);
    setError(null);
    try {
      setStats(await fetchSalesStats(d));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="stats-dashboard">
        <div className="stats-skeleton">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton-kpi shimmer" />)}
          <div className="skeleton-chart shimmer" />
          <div className="skeleton-row">
            <div className="skeleton-chart shimmer" />
            <div className="skeleton-chart shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-dashboard">
        <p className="error" role="alert">ERR // {error}</p>
        <button className="fetch-btn" onClick={() => load(days)}>Retry</button>
      </div>
    );
  }

  if (!stats) return null;

  const { totals, daily, by_rarity, by_sport, price_distribution, top_cards } = stats;

  // ── Derived data ──────────────────────────────────────────────────────────

  // Fill any date gaps in the daily series so the area chart looks continuous
  const filledDaily = (() => {
    if (!daily.length) return [];
    const map = Object.fromEntries(daily.map((d) => [d.date, d]));
    const start = new Date(daily[0].date);
    const end   = new Date(daily[daily.length - 1].date);
    const result = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      result.push(map[key] ?? { date: key, count: 0, revenue: 0 });
    }
    return result;
  })();

  const rarityWithColor = by_rarity.map((r) => ({
    ...r,
    fill: rarityColor(r.rarity),
  }));

  const revenueByRarity = by_rarity.filter((r) => r.revenue > 0).map((r) => ({
    name: r.rarity,
    value: r.revenue,
    fill: rarityColor(r.rarity),
  }));

  const axisStyle = { fontSize: 11, fontFamily: "Fira Code", fill: "#607090" };
  const gridColor = "rgba(0,229,255,0.07)";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="stats-dashboard">

      {/* ── Day range selector ─────────────────────────────────────────── */}
      <div className="stats-controls">
        <span className="stats-controls-label">// TIME_RANGE</span>
        <div className="day-selector" role="group" aria-label="Time range">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              className={`day-btn${days === d ? " active" : ""}`}
              onClick={() => setDays(d)}
              aria-pressed={days === d}
            >
              {d === 365 ? "1Y" : `${d}D`}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI row ────────────────────────────────────────────────────── */}
      <div className="kpi-row">
        <KpiCard label="TOTAL SALES"    value={fmt(totals.total_sales)}   accent="var(--cyan)" />
        <KpiCard label="TOTAL REVENUE"  value={fmtCoins(totals.total_revenue)} accent="var(--green)" />
        <KpiCard label="AVG PRICE"      value={fmtCoins(totals.avg_price)}     accent="var(--amber)" />
        <KpiCard label="RECORD SALE"    value={fmtCoins(totals.max_price)}     accent="var(--pink)" />
      </div>

      {/* ── Area chart — daily volume + revenue ────────────────────────── */}
      <ChartPanel title="// SALES_VOLUME  &  REVENUE  ·  LAST {days}D" wide>
        {filledDaily.length === 0 ? (
          <p className="chart-empty">No sales data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={filledDaily} margin={{ top: 8, right: 24, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00e5ff" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00ff88" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false}
                tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
              <YAxis yAxisId="left"  tick={axisStyle} tickLine={false} axisLine={false}
                width={32} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={axisStyle} tickLine={false}
                axisLine={false} width={52} tickFormatter={(v) => fmt(v)} />
              <Tooltip
                content={<NeonTooltip valueFormatter={(v, name) =>
                  name === "Revenue" ? fmtCoins(v) : v
                } />}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Fira Code", color: "#607090" }} />
              <Area yAxisId="left"  type="monotone" dataKey="count"   name="Sales"
                stroke="#00e5ff" fill="url(#gradCount)"   strokeWidth={2} dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue"
                stroke="#00ff88" fill="url(#gradRevenue)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>

      {/* ── Row: Rarity bar + Sport horizontal bar ─────────────────────── */}
      <div className="chart-row">

        <ChartPanel title="// SALES_BY_RARITY">
          {by_rarity.length === 0 ? (
            <p className="chart-empty">No rarity data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rarityWithColor} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                barCategoryGap="30%">
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="rarity" tick={axisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <Tooltip content={<NeonTooltip />} />
                <Bar dataKey="count" name="Sales" radius={[4, 4, 0, 0]}>
                  {rarityWithColor.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="// TOP_SPORTS_BY_SALES">
          {by_sport.length === 0 ? (
            <p className="chart-empty">No sport data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={by_sport} layout="vertical"
                margin={{ top: 8, right: 40, bottom: 0, left: 8 }} barCategoryGap="25%">
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="sport" tick={{ ...axisStyle, textAnchor: "end" }}
                  tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<NeonTooltip />} />
                <Bar dataKey="count" name="Sales" radius={[0, 4, 4, 0]}>
                  {by_sport.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

      </div>

      {/* ── Row: Revenue donut + Price distribution ─────────────────────── */}
      <div className="chart-row">

        <ChartPanel title="// REVENUE_SHARE_BY_RARITY">
          {revenueByRarity.length === 0 ? (
            <p className="chart-empty">No revenue data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={revenueByRarity} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={2} labelLine={false} label={<DonutLabel />}>
                  {revenueByRarity.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip content={<NeonTooltip valueFormatter={fmtCoins} />} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Fira Code", color: "#607090" }}
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="// PRICE_DISTRIBUTION">
          {price_distribution.length === 0 ? (
            <p className="chart-empty">No price data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={price_distribution}
                margin={{ top: 8, right: 16, bottom: 0, left: 0 }} barCategoryGap="20%">
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={axisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                <Tooltip content={<NeonTooltip />} />
                <Bar dataKey="count" name="Sales" radius={[4, 4, 0, 0]}>
                  {price_distribution.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

      </div>

      {/* ── Row: Avg price by rarity bar ──────────────────────────────── */}
      <ChartPanel title="// AVG_PRICE_BY_RARITY  (◈ coins)" wide>
        {by_rarity.length === 0 ? (
          <p className="chart-empty">No data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rarityWithColor} margin={{ top: 8, right: 24, bottom: 0, left: 8 }}
              barCategoryGap="35%">
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="rarity" tick={axisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={52}
                tickFormatter={(v) => fmt(v)} />
              <Tooltip content={<NeonTooltip valueFormatter={fmtCoins} />} />
              <Bar dataKey="avg_price" name="Avg Price" radius={[4, 4, 0, 0]}>
                {rarityWithColor.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>

      {/* ── Top 10 most traded cards table ─────────────────────────────── */}
      <ChartPanel title="// TOP_10_MOST_TRADED_CARDS" wide>
        {top_cards.length === 0 ? (
          <p className="chart-empty">No card data.</p>
        ) : (
          <div className="stats-table-wrap">
            <table className="stats-table" aria-label="Top 10 most traded cards">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Card</th>
                  <th>Rarity</th>
                  <th>Sales</th>
                  <th>Avg Price</th>
                  <th>Total Vol.</th>
                </tr>
              </thead>
              <tbody>
                {top_cards.map((card, i) => (
                  <tr key={card.cardTitle}>
                    <td className="stats-rank">{i + 1}</td>
                    <td className="stats-card-title">{card.cardTitle}</td>
                    <td>
                      <span className="stats-rarity-badge"
                        style={{ color: rarityColor(card.rarity), borderColor: rarityColor(card.rarity) + "55" }}>
                        {card.rarity || "—"}
                      </span>
                    </td>
                    <td className="stats-num">{card.count}</td>
                    <td className="stats-num">{fmtCoins(card.avg_price)}</td>
                    <td className="stats-num">{fmtCoins(card.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartPanel>

    </div>
  );
}
