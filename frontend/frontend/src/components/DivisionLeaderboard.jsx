import React, { useState, useEffect } from "react";
import { fetchDivisionLeaderboard, fetchMatches } from "../services/api";

const RARITY_COLORS = {
  Epic: "#ffd54f",
  Rare: "#a78bfa",
  Limited: "#5c9eff",
  Legendary: "#ffffff",
  Common: "#666",
};

function getWeekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon…6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function buildWeekMatchMap(matchData) {
  const matches = matchData?.data?.matches ?? [];
  const weekStart = getWeekStart();
  const map = {};
  for (const match of matches) {
    const iso = match.userDeck?.cardsEquipments?.[0]?.card?.updated ?? null;
    if (!iso) continue;
    if (new Date(iso) < weekStart) continue;
    const pseudo = match.adversaryPseudo?.toLowerCase();
    if (pseudo && !map[pseudo]) {
      map[pseudo] = match; // keep first match per opponent this week
    }
  }
  return map;
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
        <span className="deck-card-rarity-dot" style={{ background: rarityColor }} title={card?.rarity} />
      </div>
      <p className="deck-card-name">{card?.cardTitle ?? card?.clientName ?? "—"}</p>
      <p className="deck-card-score">{ce.score ?? "—"}</p>
      {ce.equipment && <p className="deck-card-equip">{ce.equipment.title}</p>}
    </div>
  );
}

function positionDelta(current, previous) {
  if (previous == null) return null;
  const delta = previous - current;
  if (delta > 0) return { label: `▲${delta}`, cls: "delta-up" };
  if (delta < 0) return { label: `▼${Math.abs(delta)}`, cls: "delta-down" };
  return { label: "=", cls: "delta-same" };
}

function Medal({ pos }) {
  if (pos === 1) return <span className="medal medal-1">1</span>;
  if (pos === 2) return <span className="medal medal-2">2</span>;
  if (pos === 3) return <span className="medal medal-3">3</span>;
  return <span className="medal medal-default">{pos}</span>;
}

const PODIUM_LABELS = { 1: "#01", 2: "#02", 3: "#03" };

function PodiumCard({ entry }) {
  const rank = entry.position;
  const delta = positionDelta(entry.position, entry.previousPosition);
  return (
    <div className={`podium-card podium-card-${rank}`} data-rank={rank}>
      <span className={`podium-medal podium-medal-${rank}`}>{PODIUM_LABELS[rank]}</span>
      <p className="podium-pseudo">{entry.pseudo}</p>
      <p className="podium-score">{entry.score}</p>
      {delta && <p className={`podium-delta ${delta.cls}`}>{delta.label}</p>}
    </div>
  );
}

export default function DivisionLeaderboard({ token }) {
  const [data, setData] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.allSettled([
      fetchDivisionLeaderboard(token),
      fetchMatches(token),
    ]).then(([lbResult, matchResult]) => {
      if (cancelled) return;
      if (lbResult.status === "fulfilled") setData(lbResult.value);
      else setError(lbResult.reason.message);
      if (matchResult.status === "fulfilled") setMatchData(matchResult.value);
      // match failure is non-fatal — leaderboard still shows without week indicators
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <p className="loading-state">Fetching division rankings…</p>;
  if (error) return <p className="error" role="alert">ERR // {error}</p>;

  const entries = data?.data?.top ?? [];
  if (entries.length === 0) return <p className="empty-state">No division ranking data.</p>;

  const weekMatchMap = buildWeekMatchMap(matchData);
  const weekMatchCount = Object.keys(weekMatchMap).length;

  const top3 = entries.filter((e) => e.position <= 3).sort((a, b) => a.position - b.position);
  const rest = entries.filter((e) => e.position > 3);
  const podiumOrder = [
    top3.find((e) => e.position === 2),
    top3.find((e) => e.position === 1),
    top3.find((e) => e.position === 3),
  ].filter(Boolean);

  const endDate = entries[0]?.endAt ? new Date(entries[0].endAt) : null;

  return (
    <>
      <p className="section-meta">
        {entries.length} players · ends {endDate ? endDate.toLocaleDateString("fr-FR") : "—"}
        {weekMatchCount > 0 && ` · ${weekMatchCount} faced this week`}
      </p>

      {podiumOrder.length > 0 && (
        <div className="podium">
          {podiumOrder.map((entry) => (
            <PodiumCard key={entry.userId} entry={entry} />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Change</th>
              <th>Matches</th>
              <th>Deck</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((entry) => {
              const delta = positionDelta(entry.position, entry.previousPosition);
              const weekMatch = weekMatchMap[entry.pseudo?.toLowerCase()];
              const isExpanded = expandedRow === entry.userId;
              return (
                <React.Fragment key={entry.userId}>
                  <tr
                    className={`leaderboard-row${weekMatch ? " leaderboard-row-faced" : ""}`}
                    onClick={() => weekMatch && setExpandedRow(isExpanded ? null : entry.userId)}
                    style={{ cursor: weekMatch ? "pointer" : "default" }}
                  >
                    <td><Medal pos={entry.position} /></td>
                    <td className="pseudo-cell">
                      {entry.pseudo}
                      {weekMatch && <span className="week-badge">THIS WEEK</span>}
                    </td>
                    <td className="score-cell">{entry.score}</td>
                    <td className={delta?.cls ?? "delta-same"}>{delta?.label ?? "—"}</td>
                    <td style={{ color: "var(--text-2)", fontFamily: "'Fira Code', monospace", fontSize: "0.72rem" }}>
                      {entry.nbMatchLaunch}
                    </td>
                    <td style={{ color: entry.deckReady ? "var(--green)" : "var(--red)", fontSize: "0.72rem", fontWeight: 700 }}>
                      {entry.deckReady ? "READY" : "—"}
                      {weekMatch && (
                        <span style={{ marginLeft: 6, color: "var(--text-3)", fontSize: "0.65rem" }}>
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && weekMatch && (
                    <tr className="leaderboard-deck-expand-row">
                      <td colSpan={6}>
                        <div className="leaderboard-deck-expand">
                          <p className="leaderboard-deck-label">
                            {entry.pseudo}'s deck
                            <span style={{ color: "var(--text-3)", marginLeft: 10, fontSize: "0.65rem", fontWeight: 400 }}>
                              {weekMatch.adversaryDeck?.scoreDeck ?? "?"} pts · match this week
                            </span>
                          </p>
                          <div className="deck-cards-row">
                            {(weekMatch.adversaryDeck?.cardsEquipments ?? []).map((ce, i) => (
                              <CardThumb key={i} ce={ce} />
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
