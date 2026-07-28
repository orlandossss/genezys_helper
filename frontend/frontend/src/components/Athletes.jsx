import React, { useState, useMemo } from "react";

const SPORT_LABELS = {
  SOC: "Football",
  DOW: "Ski",
  ATH: "Athletics",
  TEN: "Tennis",
  RUG: "Rugby",
  CYC: "Cycling",
  BOX: "Boxing",
  JUD: "Judo",
  SWI: "Swimming",
  VOL: "Volleyball",
  BAS: "Basketball",
  HAN: "Handball",
};

const LEVEL_LABELS = {
  star: "Star",
  champion: "Champion",
  talent: "Talent",
  legend: "Legend",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ArticleList({ articles, loading }) {
  if (loading) return <p className="empty-state">Loading articles…</p>;
  if (!articles || articles.length === 0)
    return <p className="empty-state">No articles found for this athlete.</p>;

  return (
    <div className="article-list">
      {articles.map((a, i) => (
        <a
          key={i}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="article-card"
        >
          <div className="article-meta">
            <span className="article-source">{a.source || "News"}</span>
            <span className="article-date">{formatDate(a.date)}</span>
          </div>
          <p className="article-title">{a.title}</p>
          {a.summary && <p className="article-summary">{a.summary}</p>}
        </a>
      ))}
    </div>
  );
}

function AthleteCard({ athlete, selected, onClick }) {
  const thumbnail = athlete.images?.overviews?.mobile?.urlThumbnail
    ?? athlete.images?.overviews?.desktop?.urlThumbnail;
  const sportLabel = SPORT_LABELS[athlete.sport] ?? athlete.sport ?? "—";
  const levelLabel = LEVEL_LABELS[athlete.level] ?? athlete.level ?? "—";

  return (
    <div
      className={`athlete-card${selected ? " selected" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-pressed={selected}
    >
      <div className="athlete-card-img">
        {thumbnail
          ? <img src={thumbnail} alt={`${athlete.firstName} ${athlete.lastName}`} />
          : <div className="athlete-card-img-placeholder">
              {athlete.firstName?.[0]}{athlete.lastName?.[0]}
            </div>
        }
      </div>
      <div className="athlete-card-info">
        <p className="athlete-name">{athlete.firstName} {athlete.lastName}</p>
        <p className="athlete-meta">{sportLabel} · {levelLabel}</p>
        {athlete.nationality && (
          <p className="athlete-nationality">{athlete.nationality}</p>
        )}
      </div>
    </div>
  );
}

export default function Athletes({ athletesData, fetchArticles, error }) {
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("All");

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
        (a) =>
          a.firstName?.toLowerCase().includes(q) ||
          a.lastName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [athleteList, sportFilter, search]);

  async function handleSelectAthlete(athlete) {
    if (selectedAthlete?.id === athlete.id) {
      setSelectedAthlete(null);
      setArticles([]);
      return;
    }
    setSelectedAthlete(athlete);
    setArticles([]);
    setArticlesLoading(true);
    try {
      const data = await fetchArticles(athlete.id);
      setArticles(data?.data ?? []);
    } catch {
      setArticles([]);
    } finally {
      setArticlesLoading(false);
    }
  }

  if (error) {
    return <p className="error" role="alert">ERR // {error}</p>;
  }

  if (athleteList.length === 0) {
    return <p className="empty-state">Athletes database is loading — check back shortly.</p>;
  }

  return (
    <div className="athletes-layout">
      {/* ── Controls ── */}
      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Sport</span>
          {sports.map((s) => (
            <button
              key={s}
              className={`filter-chip${sportFilter === s ? " active" : ""}`}
              onClick={() => setSportFilter(s)}
            >
              {SPORT_LABELS[s] ?? s}
            </button>
          ))}
        </div>
        <div className="filter-divider" />
        <input
          className="athlete-search"
          type="search"
          placeholder="Search athlete…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search athlete by name"
        />
      </div>

      <p className="section-meta">{filtered.length} athletes</p>

      <div className="athletes-layout-body">
        {/* ── Athlete grid ── */}
        <div className="athletes-grid">
          {filtered.length === 0
            ? <p className="empty-state">No athletes match your filter.</p>
            : filtered.map((athlete) => (
                <AthleteCard
                  key={athlete.id}
                  athlete={athlete}
                  selected={selectedAthlete?.id === athlete.id}
                  onClick={() => handleSelectAthlete(athlete)}
                />
              ))
          }
        </div>

        {/* ── Article panel ── */}
        {selectedAthlete && (
          <aside className="athlete-article-panel">
            <div className="athlete-article-panel-header">
              <p className="page-prompt">// NEWS_FEED</p>
              <h2 className="athlete-article-panel-name">
                {selectedAthlete.firstName}{" "}
                <span className="page-title-accent">{selectedAthlete.lastName}</span>
              </h2>
            </div>
            <ArticleList articles={articles} loading={articlesLoading} />
          </aside>
        )}
      </div>
    </div>
  );
}
