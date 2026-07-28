import React, { useState, useEffect } from "react";
import { fetchDivisionLeaderboard, fetchCupLeaderboard, fetchCups, fetchMatches } from "../services/api";

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

function DivisionView({ token }) {
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

  if (loading) return <p className="loading-state">Récupération des classements de division…</p>;
  if (error) return <p className="error" role="alert">ERR // {error}</p>;

  const entries = data?.data?.top ?? [];
  if (entries.length === 0) return <p className="empty-state">Aucune donnée de classement de division.</p>;

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
        {entries.length} joueurs · fin {endDate ? endDate.toLocaleDateString("fr-FR") : "—"}
        {weekMatchCount > 0 && ` · ${weekMatchCount} affronté(s) cette semaine`}
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
              <th>Rang</th>
              <th>Joueur</th>
              <th>Score</th>
              <th>Évolution</th>
              <th>Matchs</th>
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
                      {weekMatch && <span className="week-badge">CETTE SEMAINE</span>}
                    </td>
                    <td className="score-cell">{entry.score}</td>
                    <td className={delta?.cls ?? "delta-same"}>{delta?.label ?? "—"}</td>
                    <td style={{ color: "var(--text-2)", fontFamily: "'Fira Code', monospace", fontSize: "0.72rem" }}>
                      {entry.nbMatchLaunch}
                    </td>
                    <td style={{ color: entry.deckReady ? "var(--green)" : "var(--red)", fontSize: "0.72rem", fontWeight: 700 }}>
                      {entry.deckReady ? "PRÊT" : "—"}
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
                            Deck de {entry.pseudo}
                            <span style={{ color: "var(--text-3)", marginLeft: 10, fontSize: "0.65rem", fontWeight: 400 }}>
                              {weekMatch.adversaryDeck?.scoreDeck ?? "?"} pts · match cette semaine
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

function CupView({ token }) {
  const [cups, setCups] = useState(null);
  const [selectedCup, setSelectedCup] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // Fetch available cups on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCups(token)
      .then((result) => {
        if (cancelled) return;
        setCups(result);
        // Auto-select first cup if available
        if (result?.data?.length > 0) {
          setSelectedCup(result.data[0]);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  // Fetch leaderboard when cup is selected
  useEffect(() => {
    if (!selectedCup) return;
    let cancelled = false;
    setLoadingLeaderboard(true);
    setError(null);
    fetchCupLeaderboard(token, selectedCup.id)
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => { if (!cancelled) setLoadingLeaderboard(false); });
    return () => { cancelled = true; };
  }, [token, selectedCup]);

  if (loading) return <p className="loading-state">Récupération des coupes…</p>;
  if (error && !cups) return <p className="error" role="alert">ERR // {error}</p>;

  const cupsList = cups?.data ?? [];
  if (cupsList.length === 0) return <p className="empty-state">Aucune coupe disponible.</p>;

  const entries = data?.data?.top ?? [];
  const endDate = entries[0]?.endAt ? new Date(entries[0].endAt) : null;

  const top3 = entries.filter((e) => e.position <= 3).sort((a, b) => a.position - b.position);
  const rest = entries.filter((e) => e.position > 3);
  const podiumOrder = [
    top3.find((e) => e.position === 2),
    top3.find((e) => e.position === 1),
    top3.find((e) => e.position === 3),
  ].filter(Boolean);

  // Get rarity colors for cup constraints
  const acceptedRarities = selectedCup?.constraints?.acceptedRarities ?? [];
  const rarityBadges = acceptedRarities.map((r) => (
    <span key={r} className="rarity-badge" style={{ background: RARITY_COLORS[r] ?? "#666" }}>
      {r}
    </span>
  ));

  return (
    <>
      {/* Cup selector */}
      <div className="cup-selector" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: "0.68rem", color: "var(--text-3)", marginBottom: 6, fontFamily: "'Fira Code', monospace" }}>
          SÉLECTIONNER COUPE
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cupsList.map((cup) => (
            <button
              key={cup.id}
              className={`filter-chip${selectedCup?.id === cup.id ? " active" : ""}`}
              onClick={() => setSelectedCup(cup)}
              style={{ fontSize: "0.72rem", padding: "6px 12px" }}
            >
              {cup.name || cup.id}
            </button>
          ))}
        </div>
      </div>

      {selectedCup && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: "0.74rem", color: "var(--text-2)" }}>
            <span style={{ color: "var(--cyan)", fontWeight: 700 }}>{selectedCup.name || selectedCup.id}</span>
            {rarityBadges.length > 0 && (
              <span style={{ marginLeft: 10, display: "inline-flex", gap: 4 }}>
                {rarityBadges}
              </span>
            )}
          </p>
        </div>
      )}

      {loadingLeaderboard ? (
        <p className="loading-state">Récupération des classements de coupe…</p>
      ) : error ? (
        <p className="error" role="alert">ERR // {error}</p>
      ) : entries.length === 0 ? (
        <p className="empty-state">Aucun classement pour cette coupe.</p>
      ) : (
        <>
          <p className="section-meta">
            {entries.length} joueurs · fin {endDate ? endDate.toLocaleDateString("fr-FR") : "—"}
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
                  <th>Rang</th>
                  <th>Joueur</th>
                  <th>Score</th>
                  <th>Évolution</th>
                  <th>Matchs</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((entry) => {
                  const delta = positionDelta(entry.position, entry.previousPosition);
                  return (
                    <tr key={entry.userId} className="leaderboard-row">
                      <td><Medal pos={entry.position} /></td>
                      <td className="pseudo-cell">{entry.pseudo}</td>
                      <td className="score-cell">{entry.score}</td>
                      <td className={delta?.cls ?? "delta-same"}>{delta?.label ?? "—"}</td>
                      <td style={{ color: "var(--text-2)", fontFamily: "'Fira Code', monospace", fontSize: "0.72rem" }}>
                        {entry.nbMatchLaunch}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  );
}

const LEADERBOARD_TABS = ["Division", "Coupes"];

export default function DivisionLeaderboard({ token }) {
  const [activeTab, setActiveTab] = useState("Division");

  return (
    <div>
      <div className="sub-tabs">
        {LEADERBOARD_TABS.map((t) => (
          <button
            key={t}
            className={`sub-tab-btn${activeTab === t ? " active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Division" && <DivisionView token={token} />}
      {activeTab === "Coupes" && <CupView token={token} />}
    </div>
  );
}
