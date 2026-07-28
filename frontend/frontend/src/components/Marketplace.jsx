import React, { useState, useMemo } from "react";

const RARITY_COLORS = {
  Epic: "#ffd54f",
  Rare: "#a78bfa",
  Limited: "#5c9eff",
  Legendary: "#ffffff",
  Common: "#666",
};

const LEVEL_LABEL = {
  star: "Star",
  champion: "Champion",
  talent: "Talent",
  legend: "Legend",
};

const RARITIES = ["All", "Epic", "Rare", "Limited", "Common"];
const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "price", label: "Price" },
  { value: "score", label: "Base Score" },
];

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function buildFloorMap(listings) {
  // key: cardTitle|rarity|collectionId → min price
  const map = {};
  for (const listing of listings) {
    const item = listing.item;
    if (!item) continue;
    const key = `${item.cardTitle}|${item.rarity}|${item.collectionId}`;
    if (map[key] == null || listing.price < map[key]) {
      map[key] = listing.price;
    }
  }
  return map;
}

function ListingCard({ listing, floorPrice }) {
  const [flipped, setFlipped] = useState(false);
  const { item, price, userPseudo, created } = listing;
  const rarityColor = RARITY_COLORS[item?.rarity] ?? "#555";
  const isFloor = price === floorPrice;

  return (
    <div className="card-item" onClick={() => setFlipped((v) => !v)}>
      {!flipped ? (
        <>
          <div className="card-img-wrapper">
            {item?.image?.urlThumbnail ? (
              <img src={item.image.urlThumbnail} alt={item?.cardTitle} className="card-img" />
            ) : (
              <div className="card-img-placeholder">No image</div>
            )}
          </div>
          <div className="card-body">
            <p className="card-title">{item?.cardTitle ?? item?.clientName}</p>
            <div className="card-price-row">
              <p className="card-price">
                {price} <span className="card-currency">GNZ</span>
              </p>
              {floorPrice != null && !isFloor && (
                <p className="card-floor">
                  floor <span className="card-floor-price">{floorPrice}</span>
                </p>
              )}
              {isFloor && (
                <span className="card-floor-badge">floor</span>
              )}
            </div>
            <div className="card-tags">
              <span className="card-tag" style={{ borderColor: rarityColor, color: rarityColor }}>
                {item?.rarity}
              </span>
              <span className="card-tag">
                {LEVEL_LABEL[item?.level] ?? item?.level}
              </span>
              {item?.sport && <span className="card-tag">{item.sport}</span>}
            </div>
            <p className="card-seller">by {userPseudo}</p>
            <p className="card-date">{formatDate(created)}</p>
          </div>
          <p className="card-flip-hint">tap for details</p>
        </>
      ) : (
        <div className="card-detail">
          {item?.image?.urlFull && (
            <img src={item.image.urlFull} alt={item?.cardTitle} className="card-img-full" />
          )}
          <p className="card-title">{item?.cardTitle ?? item?.clientName}</p>
          <p style={{ color: "#555", fontSize: "0.78rem", marginBottom: 4 }}>
            {item?.collectionName}
          </p>
          <div className="card-price-row" style={{ marginBottom: 10 }}>
            <p className="card-price">
              {price} <span className="card-currency">GNZ</span>
            </p>
            {floorPrice != null && !isFloor && (
              <p className="card-floor">
                floor <span className="card-floor-price">{floorPrice}</span>
              </p>
            )}
            {isFloor && <span className="card-floor-badge">floor</span>}
          </div>
          <table className="card-stats-table">
            <tbody>
              {(item?.characteristics ?? []).map((c) => (
                <tr key={c.name}>
                  <td style={{ color: "#555", paddingRight: 12 }}>{c.name}</td>
                  <td style={{ color: "#e0e0e0", fontWeight: 600 }}>{c.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: "#3a3a4a", fontSize: "0.72rem", marginTop: 8 }}>
            Base score: {item?.baseScore}
          </p>
          <p className="card-flip-hint">tap to go back</p>
        </div>
      )}
    </div>
  );
}

export default function Marketplace({ data }) {
  const allListings = data?.data?.listings ?? [];

  const [rarityFilter, setRarityFilter] = useState("All");
  const [sportFilter, setSportFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [order, setOrder] = useState("desc");

  const floorMap = useMemo(() => buildFloorMap(allListings), [allListings]);

  const sports = useMemo(() => {
    const set = new Set(allListings.map((l) => l.item?.sport).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [allListings]);

  const filtered = useMemo(() => {
    let list = [...allListings];
    if (rarityFilter !== "All") list = list.filter((l) => l.item?.rarity === rarityFilter);
    if (sportFilter !== "All") list = list.filter((l) => l.item?.sport === sportFilter);

    list.sort((a, b) => {
      let va, vb;
      if (sortBy === "price") { va = a.price; vb = b.price; }
      else if (sortBy === "score") { va = a.item?.baseScore ?? 0; vb = b.item?.baseScore ?? 0; }
      else { va = new Date(a.created).getTime(); vb = new Date(b.created).getTime(); }
      return order === "desc" ? vb - va : va - vb;
    });

    return list;
  }, [allListings, rarityFilter, sportFilter, sortBy, order]);

  if (allListings.length === 0) {
    return <p className="empty-state">No listings to display.</p>;
  }

  return (
    <div>
      <div className="filter-bar">
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
          <span className="filter-label">Sport</span>
          <select
            className="filter-select"
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
          >
            {sports.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="filter-divider" />

        <div className="filter-group">
          <span className="filter-label">Sort</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`filter-chip${sortBy === opt.value ? " active" : ""}`}
              onClick={() => setSortBy(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="filter-group">
          <button
            className={`filter-chip${order === "desc" ? " active" : ""}`}
            onClick={() => setOrder("desc")}
          >
            ↓ Desc
          </button>
          <button
            className={`filter-chip${order === "asc" ? " active" : ""}`}
            onClick={() => setOrder("asc")}
          >
            ↑ Asc
          </button>
        </div>
      </div>

      <p className="section-meta">
        {filtered.length} of {allListings.length} listings
      </p>

      <div className="cards-grid">
        {filtered.map((listing) => {
          const item = listing.item;
          const key = `${item?.cardTitle}|${item?.rarity}|${item?.collectionId}`;
          return (
            <ListingCard
              key={listing.id}
              listing={listing}
              floorPrice={floorMap[key] ?? null}
            />
          );
        })}
      </div>
    </div>
  );
}
