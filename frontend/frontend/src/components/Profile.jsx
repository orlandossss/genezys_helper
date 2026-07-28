import React, { useState, useMemo } from "react";
import CardItem from "./CardItem";
import MatchHistory from "./MatchHistory";
import History from "./History";
import UserProfile from "./UserProfile";

const SUB_TABS = ["User Info", "My Cards", "Match History", "Transactions"];

function buildFloorMap(listings) {
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

export default function Profile({ cardsData, matchData, transactionsData, userProfileData, marketplaceData }) {
  const [active, setActive] = useState("User Info");

  // Build cardId → full card object from collection
  const cardMap = useMemo(() => {
    const map = {};
    const cards = cardsData?.data?.cardsList ?? [];
    for (const card of cards) {
      if (card.id) map[card.id] = card;
    }
    return map;
  }, [cardsData]);

  // Build cardTitle|rarity|collectionId → floor price from marketplace listings
  const floorMap = useMemo(() => {
    const listings = marketplaceData?.data?.listings ?? [];
    return buildFloorMap(listings);
  }, [marketplaceData]);

  // Build cardId → { price, currency } from purchase transactions
  const purchasePriceMap = useMemo(() => {
    const map = {};
    const transactions = transactionsData?.data?.transactionsList ?? [];
    for (const tx of transactions) {
      if (
        tx.origin !== "buy-on-secondary-market" &&
        tx.origin !== "buy-on-primary-market"
      ) continue;
      for (const p of tx.products ?? []) {
        for (const listing of p.product?.listings ?? []) {
          const id = listing.item?.id;
          if (id && listing.price != null) {
            map[id] = { price: listing.price, currency: p.currency ?? tx.currency };
          }
        }
      }
    }
    return map;
  }, [transactionsData]);

  return (
    <div>
      <div className="sub-tabs">
        {SUB_TABS.map((t) => (
          <button
            key={t}
            className={`sub-tab-btn${active === t ? " active" : ""}`}
            onClick={() => setActive(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {active === "User Info" && (
        userProfileData
          ? <UserProfile data={userProfileData} />
          : <p className="empty-state">Fetch data to see your profile.</p>
      )}

      {active === "My Cards" && (
        cardsData
          ? (() => {
              const cards = cardsData?.data?.cardsList ?? [];
              return cards.length === 0
                ? <p className="empty-state">No cards found.</p>
                : (
                  <>
                    <p className="section-meta">{cards.length} cards in collection</p>
                    <div className="cards-grid">
                      {cards.map((card) => {
                        const floorKey = `${card.cardTitle}|${card.rarity}|${card.collectionId}`;
                        return (
                          <CardItem
                            key={card.id}
                            card={card}
                            purchasePrice={purchasePriceMap[card.id]?.price ?? null}
                            purchaseCurrency={purchasePriceMap[card.id]?.currency ?? null}
                            floorPrice={floorMap[floorKey] ?? null}
                          />
                        );
                      })}
                    </div>
                  </>
                );
            })()
          : <p className="empty-state">Fetch data to see your cards.</p>
      )}

      {active === "Match History" && (
        matchData
          ? <MatchHistory data={matchData} />
          : <p className="empty-state">Fetch data to see match history.</p>
      )}

      {active === "Transactions" && (
        transactionsData
          ? <History data={transactionsData} cardMap={cardMap} />
          : <p className="empty-state">Fetch data to see transactions.</p>
      )}
    </div>
  );
}
