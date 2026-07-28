import React, { useState } from "react";

const RARITY_COLORS = {
  Epic: "#ffd54f",
  Rare: "#a78bfa",
  Limited: "#5c9eff",
  Legendary: "#ffffff",
  Common: "#666",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CardThumb({ ce }) {
  const card = ce.card;
  const rarityColor = RARITY_COLORS[card?.rarity] ?? "#555";
  const thumbnail = card?.image?.urlThumbnail;

  return (
    <div className="deck-card-thumb">
      <div className="deck-card-img-wrapper">
        {thumbnail
          ? <img src={thumbnail} alt={card?.cardTitle} className="deck-card-img" />
          : <div className="deck-card-img-placeholder">?</div>
        }
        <span
          className="deck-card-rarity-dot"
          style={{ background: rarityColor }}
          title={card?.rarity}
        />
      </div>
      <p className="deck-card-name">{card?.cardTitle ?? card?.clientName ?? "—"}</p>
      <p className="deck-card-score">{ce.score ?? "—"}</p>
      {ce.equipment && (
        <p className="deck-card-equip">{ce.equipment.title}</p>
      )}
    </div>
  );
}

function DeckDetail({ label, cards, accentColor }) {
  return (
    <div style={{ flex: 1, minWidth: 280 }}>
      <p style={{ color: accentColor, fontWeight: 700, marginBottom: 12, fontSize: "0.78rem", fontFamily: "'Fira Code', monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </p>
      <div className="deck-cards-row">
        {cards.map((ce, i) => <CardThumb key={i} ce={ce} />)}
      </div>
    </div>
  );
}

function MatchRow({ match }) {
  const [expanded, setExpanded] = useState(false);
  const userScore = match.userDeck?.scoreDeck ?? 0;
  const advScore = match.adversaryDeck?.scoreDeck ?? 0;
  const won = userScore > advScore;
  const tied = userScore === advScore;
  const resultCls = tied ? "result-d" : won ? "result-w" : "result-l";
  const resultLabel = tied ? "ÉGALITÉ" : won ? "VICTOIRE" : "DÉFAITE";
  const date = match.userDeck?.cardsEquipments?.[0]?.card?.updated ?? null;

  return (
    <>
      <tr className="match-row" onClick={() => setExpanded((v) => !v)}>
        <td>{formatDate(date)}</td>
        <td style={{ fontWeight: 600, color: "var(--text-1)" }}>{match.adversaryPseudo ?? "—"}</td>
        <td><span className={`result-badge ${resultCls}`}>{resultLabel}</span></td>
        <td style={{ color: "var(--cyan)", fontWeight: 700 }}>{userScore}</td>
        <td>{advScore}</td>
        <td style={{ color: "var(--text-3)", fontSize: "0.74rem" }}>{expanded ? "▲" : "▼"}</td>
      </tr>
      {expanded && (
        <tr className="match-expand-row">
          <td colSpan={6}>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              <DeckDetail
                label="Votre deck"
                cards={match.userDeck?.cardsEquipments ?? []}
                accentColor="var(--cyan)"
              />
              <DeckDetail
                label={`Deck de ${match.adversaryPseudo ?? "l'adversaire"}`}
                cards={match.adversaryDeck?.cardsEquipments ?? []}
                accentColor="var(--pink)"
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function MatchHistory({ data }) {
  const matches = data?.data?.matches ?? [];
  if (matches.length === 0) return <p className="empty-state">Aucun match trouvé.</p>;

  const wins = matches.filter(
    (m) => (m.userDeck?.scoreDeck ?? 0) > (m.adversaryDeck?.scoreDeck ?? 0)
  ).length;

  return (
    <>
      <p className="section-meta">
        {matches.length} matchs — {wins}V / {matches.length - wins}D
      </p>
      <table className="match-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Adversaire</th>
            <th>Résultat</th>
            <th>Votre Score</th>
            <th>Leur Score</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => <MatchRow key={m.matchId} match={m} />)}
        </tbody>
      </table>
    </>
  );
}
