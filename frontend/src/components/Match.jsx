import React, { useCallback, useEffect, useState } from "react";
import { fetchMatchDecks, optimizeDeck, launchMatch } from "../services/api";

const RARITY_COLORS = {
  Epic: "#ffd54f",
  Rare: "#a78bfa",
  Limited: "#5c9eff",
  Legendary: "#ffffff",
  Common: "#666",
  common: "#666",
};

const LEVEL_LABEL = {
  star: "Étoile",
  champion: "Champion",
  talent: "Talent",
  legend: "Légende",
};

const SLOT_ORDER = ["division", "cup_common", "cup_limited", "cup_rare", "cup_epic", "cup_legendary"];

const SLOT_LABELS = {
  division: "Division",
  cup_common: "Coupe Commune",
  cup_limited: "Coupe Limited",
  cup_rare: "Coupe Rare",
  cup_epic: "Coupe Epic",
  cup_legendary: "Coupe Legendary",
};

function DeckCardThumb({ card }) {
  const rarityColor = RARITY_COLORS[card.rarity] ?? "#555";
  const thumbnail = card.image?.urlThumbnail;
  const levelLabel = LEVEL_LABEL[card.level] ?? card.level ?? "—";
  const healthLabel = card.health != null ? `PV ${card.health}` : "PV —";
  return (
    <div className="deck-card-thumb">
      <div className="deck-card-img-wrapper">
        {thumbnail
          ? <img src={thumbnail} alt={card.clientName} className="deck-card-img" />
          : <div className="deck-card-img-placeholder">?</div>
        }
        <span className="deck-card-rarity-dot" style={{ background: rarityColor }} title={card.rarity} />
      </div>
      <p className="deck-card-name">{card.clientName ?? "—"}</p>
      <p className="deck-card-score">{card.score ?? "—"}</p>
      <p className="deck-card-equip">{levelLabel} · {healthLabel}</p>
      {card.equipmentTitle && <p className="deck-card-equip">{card.equipmentTitle}</p>}
    </div>
  );
}

function MatchResultCard({ match }) {
  const userScore = match.userDeck?.scoreDeck ?? 0;
  const advScore = match.adversaryDeck?.scoreDeck ?? 0;
  const won = userScore > advScore;
  const tied = userScore === advScore;
  const resultCls = tied ? "result-d" : won ? "result-w" : "result-l";
  const resultLabel = tied ? "ÉGALITÉ" : won ? "VICTOIRE" : "DÉFAITE";

  return (
    <div className="match-result-card">
      <span className={`result-badge ${resultCls}`}>{resultLabel}</span>
      <span className="match-result-score">{userScore} — {advScore}</span>
      <span className="match-result-opponent">vs {match.adversaryPseudo ?? "?"}</span>
    </div>
  );
}

function LeagueBox({ slot, info, busy, error, result, onOptimize, onLaunch }) {
  const cards = info?.cards ?? [];
  const hasDeck = cards.length > 0;
  const available = !!info?.available;
  const idle = busy == null;

  return (
    <div className="match-league-box">
      <div className="match-league-header">
        <span className="match-league-name">{SLOT_LABELS[slot]}</span>
        <span className={`match-league-status ${available ? "match-league-status-on" : "match-league-status-off"}`}>
          {available ? "ACTIVE" : "INDISPONIBLE"}
        </span>
      </div>

      {hasDeck ? (
        <>
          <p className="match-deck-total">
            Score total <span>{info.total_score ?? "—"}</span>
          </p>
          <div className="deck-cards-row">
            {cards.map((c) => <DeckCardThumb key={c.id} card={c} />)}
          </div>
        </>
      ) : (
        <p className="match-no-deck">Aucun deck construit.</p>
      )}

      <div className="match-league-actions">
        <button
          className="match-action-btn"
          disabled={!available || !idle}
          onClick={onOptimize}
        >
          {busy === "optimize" ? "Optimisation…" : "Optimiser"}
        </button>
        <button
          className="match-action-btn match-action-btn-launch"
          disabled={!available || !hasDeck || !idle}
          onClick={onLaunch}
        >
          {busy === "launch" ? "Lancement…" : "Lancer match"}
        </button>
      </div>

      {error && <p className="match-league-error">ERR // {error}</p>}

      {result && <MatchResultCard match={result} />}
    </div>
  );
}

export default function Match({ token }) {
  const [decks, setDecks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState({});
  const [actionError, setActionError] = useState({});
  const [matchResults, setMatchResults] = useState({});

  const loadDecks = useCallback(() => {
    setRefreshing(true);
    return fetchMatchDecks(token)
      .then((d) => { setDecks(d); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => { setRefreshing(false); setLoading(false); });
  }, [token]);

  useEffect(() => { loadDecks(); }, [loadDecks]);

  async function handleOptimize(slot) {
    setBusy((b) => ({ ...b, [slot]: "optimize" }));
    setActionError((e) => ({ ...e, [slot]: null }));
    try {
      await optimizeDeck(token, slot);
      await loadDecks();
    } catch (e) {
      setActionError((prev) => ({ ...prev, [slot]: e.message }));
    } finally {
      setBusy((b) => ({ ...b, [slot]: undefined }));
    }
  }

  async function handleLaunch(slot) {
    setBusy((b) => ({ ...b, [slot]: "launch" }));
    setActionError((e) => ({ ...e, [slot]: null }));
    try {
      const res = await launchMatch(token, slot);
      setMatchResults((m) => ({ ...m, [slot]: res.result }));
      await loadDecks();
    } catch (e) {
      setActionError((prev) => ({ ...prev, [slot]: e.message }));
    } finally {
      setBusy((b) => ({ ...b, [slot]: undefined }));
    }
  }

  if (loading) return <p className="loading-state">Récupération des decks…</p>;
  if (error && !decks) return <p className="error" role="alert">ERR // {error}</p>;
  if (!decks) return <p className="empty-state">Aucune donnée de deck.</p>;

  return (
    <div>
      {refreshing && <p className="section-meta">Actualisation…</p>}
      {error && <p className="error" role="alert">ERR // {error}</p>}
      <div className="match-grid">
        {SLOT_ORDER.map((slot) => (
          <LeagueBox
            key={slot}
            slot={slot}
            info={decks[slot]}
            busy={busy[slot]}
            error={actionError[slot]}
            result={matchResults[slot]}
            onOptimize={() => handleOptimize(slot)}
            onLaunch={() => handleLaunch(slot)}
          />
        ))}
      </div>
    </div>
  );
}
