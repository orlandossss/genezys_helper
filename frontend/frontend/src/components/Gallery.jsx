import React, { useMemo } from "react";

const RARITY_COLORS = {
  Epic: "#ffd54f",
  Rare: "#a78bfa",
  Limited: "#5c9eff",
  Legendary: "#ffffff",
  Common: "#666",
};

function buildFloorMap(listings) {
  // key: "cardTitle|rarity|level" → min price
  const map = {};
  for (const listing of listings) {
    const item = listing.item;
    if (!item) continue;
    const key = `${item.cardTitle}|${item.rarity}|${item.level}`;
    if (map[key] == null || listing.price < map[key].price) {
      map[key] = { price: listing.price, count: (map[key]?.count ?? 0) + 1 };
    } else {
      map[key].count = (map[key]?.count ?? 0) + 1;
    }
  }
  return map;
}

function GalleryCard({ card, floorPrice, listingCount }) {
  const rarityColor = RARITY_COLORS[card.rarity] ?? "#555";
  const thumbnail = card.image?.urlThumbnail ?? card.image?.url;

  return (
    <div className="gallery-card">
      <div className="card-img-wrapper">
        {thumbnail
          ? <img src={thumbnail} alt={card.cardTitle} className="card-img" />
          : <div className="card-img-placeholder">?</div>
        }
        <span
          className="gallery-rarity-dot"
          style={{ background: rarityColor }}
          title={card.rarity}
        />
      </div>
      <div className="card-body">
        <p className="card-title">{card.cardTitle ?? card.clientName ?? "—"}</p>
        <p className="card-score">{card.baseScore ?? "—"}</p>
        <div className="card-tags">
          <span className="card-tag" style={{ borderColor: rarityColor, color: rarityColor }}>
            {card.rarity}
          </span>
          {card.level && <span className="card-tag">{card.level}</span>}
          {card.sport && <span className="card-tag">{card.sport}</span>}
        </div>
        {floorPrice != null
          ? (
            <div className="gallery-floor">
              <span className="gallery-floor-price">{floorPrice}</span>
              <span className="gallery-floor-label">floor · {listingCount} listed</span>
            </div>
          )
          : <p className="gallery-no-floor">Not listed</p>
        }
      </div>
    </div>
  );
}

export default function Gallery({ cardsData, marketplaceData }) {
  const cards = cardsData?.data?.cardsList ?? [];
  const listings = marketplaceData?.data?.listings ?? [];

  const floorMap = useMemo(() => buildFloorMap(listings), [listings]);

  if (cards.length === 0) {
    return <p className="empty-state">No cards in collection.</p>;
  }

  return (
    <>
      <p className="section-meta">
        {cards.length} cards
        {listings.length > 0 ? ` · floor prices from ${listings.length} marketplace listings` : " · fetch Marketplace data to see floor prices"}
      </p>
      <div className="cards-grid">
        {cards.map((card) => {
          const key = `${card.cardTitle}|${card.rarity}|${card.level}`;
          const floor = floorMap[key];
          return (
            <GalleryCard
              key={card.id}
              card={card}
              floorPrice={floor?.price ?? null}
              listingCount={floor?.count ?? 0}
            />
          );
        })}
      </div>
    </>
  );
}
