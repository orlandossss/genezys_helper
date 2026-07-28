import React, { useState, useMemo } from "react";

const PODIUM_LABELS = { 1: "#01", 2: "#02", 3: "#03" };

const SPORT_LABELS = {
  SOC: "Football", DOW: "Ski", ATH: "Athletics", TEN: "Tennis",
  RUG: "Rugby", CYC: "Cycling", BOX: "Boxing", JUD: "Judo",
  SWI: "Swimming", VOL: "Volleyball", BAS: "Basketball", HAN: "Handball",
};

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

function PodiumCard({ entry, rank }) {
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

function RankingTable({ entries, highlightUserId }) {
  if (!entries || entries.length === 0) return null;
  return (
    <table className="leaderboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Score</th>
          <th>Change</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const delta = positionDelta(entry.position, entry.previousPosition);
          const isMe = entry.userId === highlightUserId;
          return (
            <tr
              key={entry.userId + entry.position}
              className={`leaderboard-row${isMe ? " leaderboard-row-me" : ""}`}
            >
              <td><Medal pos={entry.position} /></td>
              <td className="pseudo-cell">{entry.pseudo}{isMe && <span className="me-badge">you</span>}</td>
              <td className="score-cell">{entry.score}</td>
              <td className={delta?.cls ?? "delta-same"}>{delta?.label ?? "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Global leaderboard ────────────────────────────────────────────────────────

function GlobalLeaderboard({ data }) {
  const entries = data?.data?.top ?? [];
  if (entries.length === 0) return <p className="empty-state">No leaderboard data.</p>;

  const top3 = entries.filter((e) => e.position <= 3).sort((a, b) => a.position - b.position);
  const rest = entries.filter((e) => e.position > 3);
  const podiumOrder = [
    top3.find((e) => e.position === 2),
    top3.find((e) => e.position === 1),
    top3.find((e) => e.position === 3),
  ].filter(Boolean);

  return (
    <>
      <p className="section-meta">{entries.length} players displayed</p>
      {podiumOrder.length > 0 && (
        <div className="podium">
          {podiumOrder.map((entry) => (
            <PodiumCard key={entry.userId} entry={entry} rank={entry.position} />
          ))}
        </div>
      )}
      {rest.length > 0 && <RankingTable entries={rest} />}
    </>
  );
}

// ── Per-athlete leaderboard ───────────────────────────────────────────────────

function AthleteLeaderboard({ athletesData, token, fetchClientLeaderboard }) {
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("All");
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const athleteList = athletesData?.data ?? [];

  const sports = useMemo(() => {
    const set = new Set(athleteList.map((a) => a.sport).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [athleteList]);

  const filtered = useMemo(() => {
    let list = athleteList;
    if (sportFilter !== "All") list = list.filter((a) => a.sport === sportFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) => a.firstName?.toLowerCase().includes(q) || a.lastName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [athleteList, sportFilter, search]);

  async function handleSelect(athlete) {
    if (selectedAthlete?.id === athlete.id) return;
    setSelectedAthlete(athlete);
    setRankingData(null);
    setError(null);
    setLoading(true);
    try {
      const data = await fetchClientLeaderboard(token, athlete.id);
      setRankingData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const top = rankingData?.data?.top ?? [];
  const around = rankingData?.data?.around ?? [];

  // merge top + around, deduplicate by userId, sort by position
  const allEntries = useMemo(() => {
    const seen = new Set();
    return [...top, ...around]
      .filter((e) => { if (seen.has(e.userId)) return false; seen.add(e.userId); return true; })
      .sort((a, b) => a.position - b.position);
  }, [top, around]);

  const top3 = allEntries.filter((e) => e.position <= 3);
  const rest = allEntries.filter((e) => e.position > 3);
  const podiumOrder = [
    top3.find((e) => e.position === 2),
    top3.find((e) => e.position === 1),
    top3.find((e) => e.position === 3),
  ].filter(Boolean);

  if (athleteList.length === 0) {
    return <p className="empty-state">Athlete database loading — check back shortly.</p>;
  }

  return (
    <div className="athletes-layout-body">
      {/* ── Athlete picker ── */}
      <div className="athlete-lb-picker">
        <div className="filter-bar" style={{ flexDirection: "column", alignItems: "stretch", gap: 8, marginBottom: 8 }}>
          <input
            className="athlete-search"
            type="search"
            placeholder="Search athlete…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search athlete"
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {sports.map((s) => (
              <button
                key={s}
                className={`filter-chip${sportFilter === s ? " active" : ""}`}
                onClick={() => setSportFilter(s)}
                style={{ fontSize: "0.62rem", padding: "3px 8px" }}
              >
                {SPORT_LABELS[s] ?? s}
              </button>
            ))}
          </div>
        </div>
        <div className="athlete-lb-list">
          {filtered.map((athlete) => {
            const thumbnail = athlete.images?.overviews?.mobile?.urlThumbnail
              ?? athlete.images?.overviews?.desktop?.urlThumbnail;
            const isSelected = selectedAthlete?.id === athlete.id;
            return (
              <div
                key={athlete.id}
                className={`athlete-lb-row${isSelected ? " selected" : ""}`}
                onClick={() => handleSelect(athlete)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleSelect(athlete)}
              >
                <div className="athlete-lb-thumb">
                  {thumbnail
                    ? <img src={thumbnail} alt={`${athlete.firstName} ${athlete.lastName}`} />
                    : <div className="athlete-lb-thumb-placeholder">{athlete.firstName?.[0]}{athlete.lastName?.[0]}</div>
                  }
                </div>
                <div>
                  <p className="athlete-lb-name">{athlete.firstName} {athlete.lastName}</p>
                  <p className="athlete-lb-sport">{SPORT_LABELS[athlete.sport] ?? athlete.sport}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Ranking panel ── */}
      <div className="athlete-lb-panel">
        {!selectedAthlete && (
          <p className="empty-state">Select an athlete to see their leaderboard.</p>
        )}
        {selectedAthlete && loading && (
          <p className="loading-state">Fetching rankings…</p>
        )}
        {selectedAthlete && error && (
          <p className="error" role="alert">ERR // {error}</p>
        )}
        {selectedAthlete && !loading && rankingData && (
          <>
            <div className="athlete-article-panel-header">
              <p className="page-prompt">// CLIENT_RANKINGS</p>
              <h2 className="athlete-article-panel-name">
                {selectedAthlete.firstName}{" "}
                <span className="page-title-accent">{selectedAthlete.lastName}</span>
              </h2>
              <p style={{ fontFamily: "'Fira Code', monospace", fontSize: "0.66rem", color: "var(--text-2)", marginTop: 4 }}>
                {allEntries.length} players ranked · ends {top[0]?.endAt ? new Date(top[0].endAt).toLocaleDateString("fr-FR") : "—"}
              </p>
            </div>

            {podiumOrder.length > 0 && (
              <div className="podium" style={{ marginTop: 16 }}>
                {podiumOrder.map((entry) => (
                  <PodiumCard key={entry.userId} entry={entry} rank={entry.position} />
                ))}
              </div>
            )}
            {rest.length > 0 && (
              <RankingTable entries={rest} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

const LB_TABS = ["Global", "By Athlete"];

export default function Leaderboard({ data, athletesData, token, fetchClientLeaderboard }) {
  const [active, setActive] = useState("Global");

  return (
    <div>
      <div className="sub-tabs">
        {LB_TABS.map((t) => (
          <button
            key={t}
            className={`sub-tab-btn${active === t ? " active" : ""}`}
            onClick={() => setActive(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {active === "Global" && (
        data
          ? <GlobalLeaderboard data={data} />
          : <p className="empty-state">Fetch data to see the leaderboard.</p>
      )}

      {active === "By Athlete" && (
        <AthleteLeaderboard
          athletesData={athletesData}
          token={token}
          fetchClientLeaderboard={fetchClientLeaderboard}
        />
      )}
    </div>
  );
}
