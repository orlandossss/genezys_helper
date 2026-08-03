import React, { useState, useEffect, useRef } from "react";
import { Lock, UnlockKeyhole, X } from "lucide-react";
import ErrorBoundary from "./components/ErrorBoundary";
import Marketplace from "./components/Marketplace";
import Profile from "./components/Profile";
import Arena from "./components/Arena";
import Match from "./components/Match";
import DivisionLeaderboard from "./components/DivisionLeaderboard";
import {
  fetchMarketplace,
  fetchCards,
  fetchMatches,
  fetchTransactions,
  fetchProfile,
} from "./services/api";
import "./App.css";

const TABS = ["Marché", "Profil", "Arène", "Match", "Classement"];
const TOKEN_REQUIRED = ["Profil", "Arène", "Match", "Classement"];
const TOKEN_KEY = "genezys_token";

const PAGE_INFO = {
  Marché: {
    prompt: "// MODULE_SCAN_MARCHÉ",
    titleBase: "MARCHÉ ",
    titleAccent: "INTELLIGENCE",
    desc: "annonces en direct · analyse de prix · détection plancher · filtre rareté",
  },
  Profil: {
    prompt: "// MODULE_PROFIL_OPÉRATEUR",
    titleBase: "DOSSIER ",
    titleAccent: "AGENT",
    desc: "cartes · historique matchs · transactions · stats monnaie",
  },
  Arène: {
    prompt: "// MODULE_MOTEUR_ARÈNE",
    titleBase: "ARÈNE ",
    titleAccent: "OPTIMISEUR",
    desc: "calculateur de score · classement meilleures cartes · métriques d'efficacité",
  },
  Match: {
    prompt: "// MODULE_GESTION_MATCH",
    titleBase: "CENTRE ",
    titleAccent: "DE MATCH",
    desc: "decks actifs · optimisation automatique · lancement de match",
  },
  Classement: {
    prompt: "// MODULE_CLASSEMENT_DIVISION",
    titleBase: "CLASSEMENT ",
    titleAccent: "DIVISION",
    desc: "top 100 joueurs · score · tendance position · matchs joués · statut deck",
  },
};

const EMPTY_STATE_MSG = {
  Marché:       "Aucune annonce trouvée sur le marché.",
  Profil:       "Aucune donnée de profil chargée.",
  Arène:        "Aucune donnée de carte disponible.",
  Match:        "Aucune donnée de deck disponible.",
  Classement:   "Aucune donnée de classement.",
};

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [tokenDraft, setTokenDraft] = useState("");
  const [activeTab, setActiveTab] = useState("Marché");
  const [tokenPanelOpen, setTokenPanelOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  const [marketplaceData, setMarketplaceData] = useState(null);
  const [cardsData, setCardsData] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [transactionsData, setTransactionsData] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tokenInputRef = useRef(null);

  useEffect(() => {
    loadMarketplace();
  }, []);

  useEffect(() => {
    if (tokenPanelOpen) tokenInputRef.current?.focus();
  }, [tokenPanelOpen]);

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
      if (tab === "Profil") {
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
      return;
    }
    if (token) {
      setActiveTab(tab);
      setTokenPanelOpen(false);
      const needsFetch = {
        Profil: !cardsData && !matchData && !transactionsData && !userProfileData,
        Arène:  false,
        Match:  false,
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
    setActiveTab(target);
    loadTokenTab(target, tok);
  }

  function handleClearToken() {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setActiveTab("Marché");
  }

  const isLocked = (tab) => TOKEN_REQUIRED.includes(tab) && !token;

  const hasData = {
    Marché:      marketplaceData !== null,
    Profil:      cardsData !== null || matchData !== null || transactionsData !== null || userProfileData !== null,
    Arène:       marketplaceData !== null,
    Match:       true,
    Classement:  true,
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
              aria-label={isLocked(tab) ? `${tab} (nécessite un token)` : tab}
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
              aria-label="Connecté — cliquer pour effacer le token"
            >
              <UnlockKeyhole size={11} aria-hidden="true" />
              Connecté
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
        <div className="token-gate-panel" role="region" aria-label="Authentification par token">
          <p className="token-gate-title">
            AUTH REQUISE — CIBLE: <strong>{pendingTab}</strong>
          </p>
          <p className="token-gate-hint">
            Ouvrir <code>app.genezys.xyz</code> → DevTools (F12) → Réseau → n'importe quelle requête
            → copier la valeur de l'en-tête <code>Authorization</code>.
          </p>
          <form className="token-gate-form" onSubmit={handleTokenSubmit}>
            <input
              ref={tokenInputRef}
              type="password"
              className="token-input"
              placeholder="Coller le token d'autorisation…"
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              aria-label="Token d'autorisation"
              autoComplete="off"
            />
            <button
              type="submit"
              className="fetch-btn"
              disabled={!tokenDraft.trim() || loading}
            >
              {loading ? "Chargement…" : "Déverrouiller"}
            </button>
            <button
              type="button"
              className="clear-btn"
              aria-label="Fermer le panneau de token"
              onClick={() => { setTokenPanelOpen(false); setPendingTab(null); }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </form>
        </div>
      )}

      {/* ── Global API error ── */}
      {error && (
        <p className="error" role="alert">ERR // {error}</p>
      )}

      {/* ── Tab content ── */}
      <ErrorBoundary key={activeTab} tab={activeTab}>
        {loading && !hasData && (
          <p className="loading-state">Chargement des données…</p>
        )}

        {!loading && !hasData && !error && !tokenPanelOpen && (
          <p className="empty-state">{EMPTY_STATE_MSG[activeTab] ?? "Aucune donnée chargée."}</p>
        )}

        {activeTab === "Marché" && marketplaceData && (
          <Marketplace data={marketplaceData} />
        )}

        {activeTab === "Profil" && (cardsData || matchData || transactionsData || userProfileData) && (
          <Profile
            cardsData={cardsData}
            matchData={matchData}
            transactionsData={transactionsData}
            userProfileData={userProfileData}
            marketplaceData={marketplaceData}
          />
        )}

        {activeTab === "Arène" && marketplaceData && (
          <Arena data={marketplaceData} />
        )}

        {activeTab === "Match" && (
          <Match token={token} />
        )}

        {activeTab === "Classement" && (
          <DivisionLeaderboard token={token} />
        )}
      </ErrorBoundary>
    </div>
  );
}
