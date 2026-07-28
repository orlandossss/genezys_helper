import React, { useState, useMemo } from "react";

const RARITY_COLORS = {
  Epic: "#ffd54f",
  Rare: "#a78bfa",
  Limited: "#5c9eff",
  Legendary: "#ffffff",
  Common: "#666",
};

const LEVELS = ["talent", "champion", "star"];
const LEVEL_BONUS = { talent: 0.50, champion: 0.40, star: 0.20 };
const LEVEL_PENALTY = { talent: -0.10, champion: -0.15, star: -0.30 };

const LEVEL_LABEL = { talent: "Talent", champion: "Champion", star: "Star" };

function computeArenaScore(item, arenaLevel, attr1, attr2) {
  const B = item.baseScore ?? 0;
  const chars = item.characteristics ?? [];

  const matchAttrs = [attr1, attr2]
    .filter(Boolean)
    .map((a) => a.toLowerCase());

  const attrSum = chars
    .filter((c) => matchAttrs.includes(c.name?.toLowerCase()))
    .reduce((s, c) => s + (c.value ?? 0), 0);

  const A = B * (attrSum * 5) / 100;

  const cardLevel = item.level?.toLowerCase() ?? "";
  const arenaLvl = arenaLevel?.toLowerCase() ?? "";
  const levelMult =
    cardLevel === arenaLvl
      ? (LEVEL_BONUS[arenaLvl] ?? 0)
      : (LEVEL_PENALTY[cardLevel] ?? -0.10);
  const C = B * levelMult;

  const H = B * 0.15;
  const P = B * 0.20;

  return Math.round(B + A + C + H + P);
}

function deduplicateListings(listings) {
  // Keep cheapest listing per (cardTitle, rarity, level)
  const map = {};
  for (const listing of listings) {
    const item = listing.item;
    if (!item) continue;
    const key = `${item.cardTitle}|${item.rarity}|${item.level}`;
    if (!map[key] || listing.price < map[key].price) {
      map[key] = { ...item, price: listing.price };
    }
  }
  return Object.values(map);
}

// ── Arena Builder ──────────────────────────────────────────

function ArenaBuilder({ listings }) {
  const [arenaLevel, setArenaLevel] = useState("champion");
  const [attr1, setAttr1] = useState("");
  const [attr2, setAttr2] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("score");

  const allAttrs = useMemo(() => {
    const set = new Set();
    for (const l of listings) {
      for (const c of l.item?.characteristics ?? []) {
        if (c.name) set.add(c.name);
      }
    }
    return Array.from(set).sort();
  }, [listings]);

  const cards = useMemo(() => deduplicateListings(listings), [listings]);

  const results = useMemo(() => {
    let list = cards;
    if (maxPrice) list = list.filter((c) => c.price <= Number(maxPrice));

    list = list.map((card) => {
      const score = computeArenaScore(card, arenaLevel, attr1, attr2);
      const efficiency = card.price > 0 ? (score / card.price).toFixed(4) : 0;
      return { ...card, arenaScore: score, efficiency: Number(efficiency) };
    });

    list.sort((a, b) =>
      sortBy === "efficiency" ? b.efficiency - a.efficiency : b.arenaScore - a.arenaScore
    );

    return list.slice(0, 100);
  }, [cards, arenaLevel, attr1, attr2, maxPrice, sortBy]);

  return (
    <div>
      <div className="arena-controls">
        <div className="filter-group">
          <span className="filter-label">Level</span>
          {LEVELS.map((l) => (
            <button
              key={l}
              className={`filter-chip${arenaLevel === l ? " active" : ""}`}
              onClick={() => setArenaLevel(l)}
            >
              {LEVEL_LABEL[l]}
            </button>
          ))}
        </div>

        <div className="filter-divider" />

        <div className="filter-group">
          <span className="filter-label">Attr 1</span>
          <select
            className="filter-select"
            value={attr1}
            onChange={(e) => setAttr1(e.target.value)}
          >
            <option value="">—</option>
            {allAttrs.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Attr 2</span>
          <select
            className="filter-select"
            value={attr2}
            onChange={(e) => setAttr2(e.target.value)}
          >
            <option value="">—</option>
            {allAttrs.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="filter-divider" />

        <div className="filter-group">
          <span className="filter-label">Max Price</span>
          <input
            type="number"
            className="filter-select arena-price-input"
            placeholder="No limit"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <div className="filter-divider" />

        <div className="filter-group">
          <span className="filter-label">Sort</span>
          <button
            className={`filter-chip${sortBy === "score" ? " active" : ""}`}
            onClick={() => setSortBy("score")}
          >
            Arena Score
          </button>
          <button
            className={`filter-chip${sortBy === "efficiency" ? " active" : ""}`}
            onClick={() => setSortBy("efficiency")}
          >
            Efficiency
          </button>
        </div>
      </div>

      <p className="section-meta">
        Top {results.length} cards · arena: {LEVEL_LABEL[arenaLevel]}
        {attr1 ? ` + ${attr1}` : ""}
        {attr2 ? ` + ${attr2}` : ""}
      </p>

      <div className="arena-table-wrapper">
        <table className="arena-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Card</th>
              <th>Rarity</th>
              <th>Level</th>
              <th>Base</th>
              <th>Arena Score</th>
              <th>Price</th>
              <th>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {results.map((card, i) => {
              const rarityColor = RARITY_COLORS[card.rarity] ?? "#555";
              return (
                <tr key={`${card.cardTitle}-${i}`} className="arena-row">
                  <td className="arena-rank">{i + 1}</td>
                  <td className="arena-card-name">{card.cardTitle ?? card.clientName ?? "—"}</td>
                  <td>
                    <span className="card-tag" style={{ borderColor: rarityColor, color: rarityColor }}>
                      {card.rarity}
                    </span>
                  </td>
                  <td className="arena-level">{LEVEL_LABEL[card.level?.toLowerCase()] ?? card.level}</td>
                  <td className="arena-base">{card.baseScore}</td>
                  <td className="arena-score">{card.arenaScore}</td>
                  <td className="arena-price">{card.price ?? "—"}</td>
                  <td className="arena-efficiency">{card.efficiency}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Arena Ranker ──────────────────────────────────────────

const ALL_LEVEL_COMBOS = (() => {
  const combos = [];
  for (const level of LEVELS) {
    combos.push({ level, attr1: "", attr2: "" });
  }
  return combos;
})();

function buildAllCombos(attrs) {
  const combos = [];
  for (const level of LEVELS) {
    for (let i = 0; i < attrs.length; i++) {
      for (let j = i + 1; j < attrs.length; j++) {
        combos.push({ level, attr1: attrs[i], attr2: attrs[j] });
      }
    }
  }
  return combos;
}

function ArenaRanker({ listings }) {
  const [rarityFilter, setRarityFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");

  const RARITIES = ["All", "Epic", "Rare", "Limited", "Common"];

  const allAttrs = useMemo(() => {
    const set = new Set();
    for (const l of listings) {
      for (const c of l.item?.characteristics ?? []) {
        if (c.name) set.add(c.name);
      }
    }
    return Array.from(set).sort();
  }, [listings]);

  const combos = useMemo(() => buildAllCombos(allAttrs), [allAttrs]);

  const cards = useMemo(() => {
    let list = deduplicateListings(listings);
    if (rarityFilter !== "All") list = list.filter((c) => c.rarity === rarityFilter);
    if (levelFilter !== "All") list = list.filter((c) => c.level?.toLowerCase() === levelFilter);
    if (maxPrice) list = list.filter((c) => c.price <= Number(maxPrice));
    return list;
  }, [listings, rarityFilter, levelFilter, maxPrice]);

  const ranked = useMemo(() => {
    if (cards.length === 0 || combos.length === 0) return [];

    // Build scores for every card × every combo
    const scores = cards.map((card) =>
      combos.map((combo) => computeArenaScore(card, combo.level, combo.attr1, combo.attr2))
    );

    // For each combo, rank cards by their score
    const ranks = combos.map((_, ci) => {
      const sorted = [...cards.map((_, ri) => ({ ri, score: scores[ri][ci] }))]
        .sort((a, b) => b.score - a.score);
      const rankMap = {};
      sorted.forEach((item, pos) => { rankMap[item.ri] = pos + 1; });
      return rankMap;
    });

    // Aggregate per card
    return cards.map((card, ri) => {
      const cardRanks = combos.map((_, ci) => ranks[ci][ri]);
      const avgRank = cardRanks.reduce((s, r) => s + r, 0) / cardRanks.length;
      const top5 = cardRanks.filter((r) => r <= 5).length;
      const top10 = cardRanks.filter((r) => r <= 10).length;
      const bestScore = Math.max(...combos.map((combo, ci) => scores[ri][ci]));

      // Find best 3 arenas
      const withScore = combos.map((combo, ci) => ({ combo, score: scores[ri][ci], rank: ranks[ci][ri] }));
      withScore.sort((a, b) => b.score - a.score);
      const bestArenas = withScore.slice(0, 3).map((w) => ({
        label: `${LEVEL_LABEL[w.combo.level] ?? w.combo.level}${w.combo.attr1 ? ` / ${w.combo.attr1}` : ""}${w.combo.attr2 ? ` + ${w.combo.attr2}` : ""}`,
        score: w.score,
        rank: w.rank,
      }));

      return {
        ...card,
        avgRank: Math.round(avgRank * 10) / 10,
        top5,
        top10,
        bestScore,
        bestArenas,
      };
    }).sort((a, b) => b.top10 - a.top10 || a.avgRank - b.avgRank);
  }, [cards, combos]);

  return (
    <div>
      <div className="arena-controls">
        <div className="filter-group">
          <span className="filter-label">Rarity</span>
          {RARITIES.map((r) => (
            <button
              key={r}
              className={`filter-chip${rarityFilter === r ? " active" : ""}`}
              onClick={() => setRarityFilter(r)}
              style={r !== "All" && rarityFilter === r ? { borderColor: RARITY_COLORS[r], color: RARITY_COLORS[r] } : {}}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="filter-divider" />

        <div className="filter-group">
          <span className="filter-label">Level</span>
          {["All", ...LEVELS].map((l) => (
            <button
              key={l}
              className={`filter-chip${levelFilter === l ? " active" : ""}`}
              onClick={() => setLevelFilter(l)}
            >
              {LEVEL_LABEL[l] ?? "All"}
            </button>
          ))}
        </div>

        <div className="filter-divider" />

        <div className="filter-group">
          <span className="filter-label">Max Price</span>
          <input
            type="number"
            className="filter-select arena-price-input"
            placeholder="No limit"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      <p className="section-meta">
        {ranked.length} unique cards · {combos.length} arena combinations evaluated
      </p>

      <div className="arena-table-wrapper">
        <table className="arena-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Card</th>
              <th>Rarity</th>
              <th>Level</th>
              <th>Best Score</th>
              <th>Top 5</th>
              <th>Top 10</th>
              <th>Avg Rank</th>
              <th>Price</th>
              <th>Best Arenas</th>
            </tr>
          </thead>
          <tbody>
            {ranked.slice(0, 100).map((card, i) => {
              const rarityColor = RARITY_COLORS[card.rarity] ?? "#555";
              return (
                <tr key={`${card.cardTitle}-${i}`} className="arena-row">
                  <td className="arena-rank">{i + 1}</td>
                  <td className="arena-card-name">{card.cardTitle ?? card.clientName ?? "—"}</td>
                  <td>
                    <span className="card-tag" style={{ borderColor: rarityColor, color: rarityColor }}>
                      {card.rarity}
                    </span>
                  </td>
                  <td className="arena-level">{LEVEL_LABEL[card.level?.toLowerCase()] ?? card.level}</td>
                  <td className="arena-score">{card.bestScore}</td>
                  <td className="arena-top5">{card.top5}</td>
                  <td className="arena-top10">{card.top10}</td>
                  <td className="arena-avgrank">{card.avgRank}</td>
                  <td className="arena-price">{card.price ?? "—"}</td>
                  <td className="arena-best-arenas">
                    {card.bestArenas.map((a, j) => (
                      <span key={j} className="arena-best-tag" title={`Score: ${a.score} · Rank: #${a.rank}`}>
                        {a.label}
                      </span>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Arena component ──────────────────────────────────

const ARENA_TABS = ["Arena Builder", "Arena Ranker"];

export default function Arena({ data }) {
  const [active, setActive] = useState("Arena Builder");
  const listings = data?.data?.listings ?? [];

  if (listings.length === 0) {
    return <p className="empty-state">Fetch data to load Arena tools.</p>;
  }

  return (
    <div>
      <div className="sub-tabs">
        {ARENA_TABS.map((t) => (
          <button
            key={t}
            className={`sub-tab-btn${active === t ? " active" : ""}`}
            onClick={() => setActive(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {active === "Arena Builder" && <ArenaBuilder listings={listings} />}
      {active === "Arena Ranker" && <ArenaRanker listings={listings} />}
    </div>
  );
}
