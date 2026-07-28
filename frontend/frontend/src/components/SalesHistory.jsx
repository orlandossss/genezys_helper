import React, { useState, useMemo } from "react";

const RARITY_COLORS = {
  Epic: "#ffd54f",
  Rare: "#a78bfa",
  Limited: "#5c9eff",
  Legendary: "#ffffff",
  Common: "#666",
};

const CURRENCY_LABELS = {
  "gnz-token": "GNZ",
  "genezys-gems": "Gems",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function SaleRow({ sale }) {
  const isLinked = !!sale.cardTitle;
  const rarityColor = RARITY_COLORS[sale.rarity] ?? "#555";
  const currency = CURRENCY_LABELS[sale.currency] ?? sale.currency ?? "GNZ";
  const thumbnail = sale.image?.urlThumbnail;

  if (!isLinked) {
    return (
      <div className="sale-row sale-row--unlinked">
        <div className="sale-img">
          <div className="sale-img-placeholder">?</div>
        </div>
        <div className="sale-info">
          <p className="sale-title sale-title--unlinked">Unlinked card</p>
          <p className="sale-card-id">{sale.cardId}</p>
        </div>
        <div className="sale-price">
          {sale.price} <span className="sale-currency">{currency}</span>
        </div>
        <div className="sale-date">{formatDate(sale.soldAt)}</div>
      </div>
    );
  }

  return (
    <div className="sale-row">
      <div className="sale-img">
        {thumbnail ? (
          <img src={thumbnail} alt={sale.cardTitle} className="sale-thumb" loading="lazy" />
        ) : (
          <div className="sale-img-placeholder">?</div>
        )}
      </div>
      <div className="sale-info">
        <p className="sale-title">{sale.cardTitle}</p>
        <div className="sale-tags">
          {sale.rarity && (
            <span className="card-tag" style={{ borderColor: rarityColor, color: rarityColor }}>
              {sale.rarity}
            </span>
          )}
          {sale.sport && <span className="card-tag">{sale.sport}</span>}
          {sale.number != null && <span className="card-tag">#{sale.number}</span>}
        </div>
        {sale.collectionName && (
          <p className="sale-collection">{sale.collectionName}</p>
        )}
      </div>
      <div className="sale-price">
        {sale.price} <span className="sale-currency">{currency}</span>
      </div>
      <div className="sale-date">{formatDate(sale.soldAt)}</div>
    </div>
  );
}

export default function SalesHistory({ data }) {
  const [showUnlinked, setShowUnlinked] = useState(false);

  const sales = data?.sales ?? [];
  const unlinkedCount = useMemo(() => sales.filter((s) => !s.cardTitle).length, [sales]);
  const filtered = useMemo(
    () => (showUnlinked ? sales : sales.filter((s) => s.cardTitle)),
    [sales, showUnlinked]
  );

  if (sales.length === 0) {
    return (
      <p className="empty-state">
        No sales recorded yet — connect your token and share your transaction data to populate the database.
      </p>
    );
  }

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-group">
          <label className="sales-toggle">
            <input
              type="checkbox"
              checked={showUnlinked}
              onChange={(e) => setShowUnlinked(e.target.checked)}
            />
            <span>Show unlinked sales ({unlinkedCount})</span>
          </label>
        </div>
        <div className="filter-divider" />
        <span className="filter-label">{filtered.length} of {sales.length} sales</span>
      </div>

      <div className="sales-list">
        {filtered.map((sale) => (
          <SaleRow key={sale.transactionId} sale={sale} />
        ))}
      </div>
    </div>
  );
}
