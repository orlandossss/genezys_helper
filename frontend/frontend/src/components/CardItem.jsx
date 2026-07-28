import React, { useState } from "react";

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

const LEVEL_LABEL = {
  star: "Star",
  champion: "Champion",
  talent: "Talent",
  legend: "Legend",
};

export default function CardItem({ card, purchasePrice, purchaseCurrency, floorPrice }) {
  const [flipped, setFlipped] = useState(false);

  const rarityColor = RARITY_COLORS[card.rarity] ?? "#555";
  const thumbnail = card.image?.urlThumbnail;
  const fullImage = card.image?.urlFull;
  const currencyLabel = CURRENCY_LABELS[purchaseCurrency] ?? purchaseCurrency ?? "GNZ";
  const isFloor = floorPrice != null && purchasePrice != null && purchasePrice <= floorPrice;

  return (
    <div className="card-item" onClick={() => setFlipped((v) => !v)}>
      {!flipped ? (
        <>
          <div className="card-img-wrapper">
            {(fullImage || thumbnail) ? (
              <img src={fullImage ?? thumbnail} alt={card.cardTitle} className="card-img" loading="lazy" />
            ) : (
              <div className="card-img-placeholder">No image</div>
            )}
          </div>
          <div className="card-body">
            <p className="card-title">{card.cardTitle ?? card.clientName}</p>
            <p className="card-score">{card.baseScore} pts</p>
            <div className="card-tags">
              <span className="card-tag" style={{ borderColor: rarityColor, color: rarityColor }}>
                {card.rarity}
              </span>
              <span className="card-tag">
                {LEVEL_LABEL[card.level] ?? card.level}
              </span>
              {card.sport && <span className="card-tag">{card.sport}</span>}
            </div>
            <div className="card-health">
              <div
                className="card-health-bar"
                style={{ width: `${card.health?.points ?? 0}%` }}
              />
              <span className="card-health-label">
                HP {card.health?.points ?? "?"}
              </span>
            </div>
            {floorPrice != null && (
              <div className="card-price-row">
                <p className="card-floor">
                  floor <span className="card-floor-price">{floorPrice}</span>
                </p>
                {isFloor && <span className="card-floor-badge">floor</span>}
              </div>
            )}
            {purchasePrice != null && (
              <p className="card-purchase-price">
                Paid: <span>{purchasePrice}</span> {currencyLabel}
              </p>
            )}
          </div>
          <p className="card-flip-hint">click for details</p>
        </>
      ) : (
        <div className="card-detail">
          {fullImage && (
            <img src={fullImage} alt={card.cardTitle} className="card-img-full" />
          )}
          <p className="card-title">{card.cardTitle ?? card.clientName}</p>
          <p style={{ color: "var(--text-2)", fontSize: "0.72rem", marginBottom: 8, fontFamily: "'Fira Code', monospace", letterSpacing: "0.04em" }}>
            {card.collectionName}
          </p>
          {floorPrice != null && (
            <div className="card-price-row" style={{ marginBottom: 4 }}>
              <p className="card-floor">
                floor <span className="card-floor-price">{floorPrice}</span>
              </p>
              {isFloor && <span className="card-floor-badge">floor</span>}
            </div>
          )}
          {purchasePrice != null && (
            <p style={{ color: "var(--amber)", fontSize: "0.72rem", fontFamily: "'Fira Code', monospace", marginBottom: 8, letterSpacing: "0.04em" }}>
              Paid: <span style={{ fontWeight: 700 }}>{purchasePrice}</span> {currencyLabel}
            </p>
          )}
          <table className="card-stats-table">
            <tbody>
              {(card.characteristics ?? []).map((c) => (
                <tr key={c.name}>
                  <td style={{ color: "var(--text-2)", paddingRight: 12 }}>{c.name}</td>
                  <td style={{ color: "var(--text-1)", fontWeight: 600 }}>{c.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {card.activeBuffs?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {card.activeBuffs.map((b, i) => (
                <p key={i} style={{ color: "var(--green)", fontSize: "0.72rem", fontFamily: "'Fira Code', monospace" }}>
                  {b.itemName}
                </p>
              ))}
            </div>
          )}
          <p className="card-flip-hint">click to go back</p>
        </div>
      )}
    </div>
  );
}
