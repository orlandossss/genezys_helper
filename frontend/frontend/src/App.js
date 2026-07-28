import React, { useState, useEffect, useRef } from "react";
import { Lock, UnlockKeyhole, X } from "lucide-react";
import ErrorBoundary from "./components/ErrorBoundary";
import Marketplace from "./components/Marketplace";
import Profile from "./components/Profile";
import Arena from "./components/Arena";
import Athletes from "./components/Athletes";
import SalesHistory from "./components/SalesHistory";
import SalesDashboard from "./components/SalesDashboard";
import DivisionLeaderboard from "./components/DivisionLeaderboard";
import ConsentModal from "./components/ConsentModal";
import {
  fetchMarketplace,
  fetchCards,
  fetchMatches,
  fetchTransactions,
  fetchProfile,
  fetchAthletes,
  fetchArticles,
  fetchRecentSales,
  contributeTransactions,
} from "./services/api";
import "./App.css";

const TABS = ["Marketplace", "Profile", "Arena", "Athletes", "Sales", "Stats", "Leaderboard"];
const TOKEN_REQUIRED = ["Profile", "Arena", "Leaderboard"];
const TOKEN_KEY = "genezys_token";

const PAGE_INFO = {
  Marketplace: {
    prompt: "// MARKET_SCAN_MODULE",
    titleBase: "MARKETPLACE ",
    titleAccent: "INTELLIGENCE",
    desc: "live listings · price analysis · floor detection · rarity filter",
  },
  Profile: {
    prompt: "// OPERATOR_PROFILE_MODULE",
    titleBase: "AGENT ",
    titleAccent: "DOSSIER",
    desc: "cards · match history · transactions · currency stats",
  },
  Arena: {
    prompt: "// ARENA_ENGINE_MODULE",
    titleBase: "ARENA ",
    titleAccent: "OPTIMIZER",
    desc: "score calculator · best card rankings · efficiency metrics",
  },
  Athletes: {
    prompt: "// ATHLETE_INTEL_MODULE",
    titleBase: "ATHLETE ",
    titleAccent: "INTEL",
    desc: "athlete profiles · news feed · article database · sport filter",
  },
  Sales: {
    prompt: "// MARKET_HISTORY_MODULE",
    titleBase: "SALES ",
    titleAccent: "HISTORY",
    desc: "recent transactions · price records · community sale database",
  },
  Stats: {
    prompt: "// ANALYTICS_ENGINE_MODULE",
    titleBase: "SALES ",
    titleAccent: "ANALYTICS",
    desc: "charts · trends · rarity breakdown · price distribution · top cards",
  },
  Leaderboard: {
    prompt: "// DIVISION_RANKINGS_MODULE",
    titleBase: "DIVISION ",
    titleAccent: "LEADERBOARD",
    desc: "top 100 players · score · position trend · matches played · deck status",
  },
};

const EMPTY_STATE_MSG = {
  Marketplace:  "No marketplace listings found.",
  Profile:      "No profile data loaded.",
  Arena:        "No card data available.",
  Sales:        "No recent sales found.",
  Leaderboard:  "No leaderboard data.",
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [tokenDraft, setTokenDraft] = useState("");
  const [activeTab, setActiveTab] = useState("Marketplace");
  const [tokenPanelOpen, setTokenPanelOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  const [athletesData, setAthletesData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [marketplaceData, setMarketplaceData] = useState(null);
  const [cardsData, setCardsData] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [transactionsData, setTransactionsData] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [athletesError, setAthletesError] = useState(null);

  const [consentPending, setConsentPending] = useState(false);
  const [consentToken, setConsentToken] = useState(null);
  const [consentTarget, setConsentTarget] = useState(null);
  const [consentLoading, setConsentLoading] = useState(false);

  const tokenInputRef = useRef(null);

  useEffect(() => {
    loadMarketplace();
    loadAthletes();
  }, []);

  async function loadSales() {
    setLoading(true);
    setError(null);
    try {
      setSalesData(await fetchRecentSales());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tokenPanelOpen) tokenInputRef.current?.focus();
  }, [tokenPanelOpen]);

  async function loadAthletes() {
    try {
      setAthletesData(await fetchAthletes());
    } catch (e) {
      setAthletesError(e.message);
    }
  }

  async function loadMarketplace() {
    setLoading(true);
    setError(null);
    try {
      setMarketplaceData(await fetchMarketplace());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTokenTab(tab, tok) {
    setLoading(true);
    setError(null);
    try {
      if (tab === "Profile") {
        const [cards, matches, transactions, profile] = await Promise.all([
          fetchCards(tok),
          fetchMatches(tok),
          fetchTransactions(tok),
          fetchProfile(tok),
        ]);
        setCardsData(cards);
        setMatchData(matches);
        setTransactionsData(transactions);
        setUserProfileData(profile);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleTabClick(tab) {
    setError(null);
    if (!TOKEN_REQUIRED.includes(tab)) {
      setActiveTab(tab);
      setTokenPanelOpen(false);
      if (tab === "Sales" && !salesData) loadSales();
      // Stats tab is self-fetching (SalesDashboard manages its own state)
      return;
    }
    if (token) {
      setActiveTab(tab);
      setTokenPanelOpen(false);
      const needsFetch = {
        Profile: !cardsData && !matchData && !transactionsData && !userProfileData,
        Arena:   false,
      }[tab];
      if (needsFetch) loadTokenTab(tab, token);
    } else {
      setPendingTab(tab);
      setTokenPanelOpen(true);
    }
  }

  async function handleTokenSubmit(e) {
    e.preventDefault();
    const tok = tokenDraft.trim();
    if (!tok) return;
    setToken(tok);
    localStorage.setItem(TOKEN_KEY, tok);
    setTokenDraft("");
    setTokenPanelOpen(false);
    const target = pendingTab ?? activeTab;
    setPendingTab(null);
    // Show consent modal before loading tab data
    setConsentToken(tok);
    setConsentTarget(target);
    setConsentPending(true);
  }

  async function handleConsentAccept() {
    setConsentLoading(true);
    try {
      await contributeTransactions(consentToken);
    } catch {
      // Contribution failure is silent — still proceed with normal auth
    } finally {
      setConsentLoading(false);
    }
    _finishAuth(consentToken, consentTarget);
  }

  function handleConsentDecline() {
    _finishAuth(consentToken, consentTarget);
  }

  function _finishAuth(tok, target) {
    setConsentPending(false);
    setConsentToken(null);
    setConsentTarget(null);
    setActiveTab(target);
    loadTokenTab(target, tok);
  }

  function handleClearToken() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setActiveTab("Marketplace");
  }

  const isLocked = (tab) => TOKEN_REQUIRED.includes(tab) && !token;

  const hasData = {
    Marketplace: marketplaceData !== null,
    Profile:     cardsData !== null || matchData !== null || transactionsData !== null || userProfileData !== null,
    Arena:       marketplaceData !== null,
    Athletes:    true,
    Sales:        salesData !== null,
    Stats:        true,
    Leaderboard:  true,
  }[activeTab];

  const page = PAGE_INFO[activeTab];

  return (
    <div className="app">
      {/* ── Top bar ── */}
      <header className="topbar">
        <div className="topbar-logo" aria-label="Genezys Helper home">
          <span className="logo-symbol" aria-hidden="true">G</span>
          <span className="logo-text">Genezys Helper</span>
        </div>

        <nav className="topbar-nav" role="navigation" aria-label="Main navigation">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`nav-btn${activeTab === tab ? " active" : ""}${isLocked(tab) ? " locked" : ""}`}
              onClick={() => handleTabClick(tab)}
              aria-label={isLocked(tab) ? `${tab} (requires token)` : tab}
              aria-current={activeTab === tab ? "page" : undefined}
            >
              {isLocked(tab) && (
                <span className="nav-lock" aria-hidden="true">
                  <Lock size={10} />
                </span>
              )}
              {tab}
            </button>
          ))}
        </nav>

        <div className="topbar-right">
          {token && (
            <button
              onClick={handleClearToken}
              className="auth-btn"
              aria-label="Signed in — click to clear token"
            >
              <UnlockKeyhole size={11} aria-hidden="true" />
              Signed In
            </button>
          )}
        </div>
      </header>

      {/* ── Per-tab page header ── */}
      <div className="page-header">
        <p className="page-prompt">{page.prompt}</p>
        <h1 className="page-title">
          {page.titleBase}
          <span className="page-title-accent">{page.titleAccent}</span>
        </h1>
        <p className="page-desc">{page.desc}</p>
      </div>

      {/* ── Token gate ── */}
      {tokenPanelOpen && (
        <div className="token-gate-panel" role="region" aria-label="Token authentication">
          <p className="token-gate-title">
            AUTH REQUIRED — TARGET: <strong>{pendingTab}</strong>
          </p>
          <p className="token-gate-hint">
            Open <code>app.genezys.xyz</code> → DevTools (F12) → Network → any request
            → copy the <code>Authorization</code> header value.
          </p>
          <form className="token-gate-form" onSubmit={handleTokenSubmit}>
            <input
              ref={tokenInputRef}
              type="password"
              className="token-input"
              placeholder="Paste Authorization token…"
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              aria-label="Authorization token"
              autoComplete="off"
            />
            <button
              type="submit"
              className="fetch-btn"
              disabled={!tokenDraft.trim() || loading}
            >
              {loading ? "Loading…" : "Unlock"}
            </button>
            <button
              type="button"
              className="clear-btn"
              aria-label="Close token panel"
              onClick={() => { setTokenPanelOpen(false); setPendingTab(null); }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </form>
        </div>
      )}

      {/* ── Consent modal ── */}
      {consentPending && (
        <ConsentModal
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
          loading={consentLoading}
        />
      )}

      {/* ── Global API error ── */}
      {error && (
        <p className="error" role="alert">ERR // {error}</p>
      )}

      {/* ── Tab content ── */}
      <ErrorBoundary key={activeTab} tab={activeTab}>
        {loading && !hasData && (
          <p className="loading-state">Fetching data…</p>
        )}

        {!loading && !hasData && !error && !tokenPanelOpen && (
          <p className="empty-state">{EMPTY_STATE_MSG[activeTab] ?? "No data loaded."}</p>
        )}

        {activeTab === "Marketplace" && marketplaceData && (
          <Marketplace data={marketplaceData} />
        )}

        {activeTab === "Profile" && (cardsData || matchData || transactionsData || userProfileData) && (
          <Profile
            cardsData={cardsData}
            matchData={matchData}
            transactionsData={transactionsData}
            userProfileData={userProfileData}
            marketplaceData={marketplaceData}
          />
        )}

        {activeTab === "Arena" && marketplaceData && (
          <Arena data={marketplaceData} />
        )}

        {activeTab === "Athletes" && (
          <Athletes
            athletesData={athletesData}
            fetchArticles={fetchArticles}
            error={athletesError}
          />
        )}

        {activeTab === "Sales" && salesData && (
          <SalesHistory data={salesData} />
        )}

        {activeTab === "Stats" && (
          <SalesDashboard />
        )}

        {activeTab === "Leaderboard" && (
          <DivisionLeaderboard token={token} />
        )}
      </ErrorBoundary>
    </div>
  );
}
