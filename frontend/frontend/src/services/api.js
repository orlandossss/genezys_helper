const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export async function fetchLeaderboard(token) {
  const response = await fetch(
    `${BASE_URL}/leaderboard/overview?topx=100&aroundx=10&language=FR`,
    { headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchDivisionLeaderboard(token, topx = 100) {
  const params = new URLSearchParams({ topx, aroundx: 0, language: "FR" });
  const response = await fetch(
    `${BASE_URL}/leaderboard/division?${params.toString()}`,
    { headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchClientLeaderboard(token, clientId, topx = 10, aroundx = 10) {
  const params = new URLSearchParams({ clientId, topx, aroundx, language: "FR" });
  const response = await fetch(
    `${BASE_URL}/leaderboard/client?${params.toString()}`,
    { headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchMatches(token, maxResults = 50) {
  const response = await fetch(
    `${BASE_URL}/matches?maxResults=${maxResults}&language=FR`,
    { headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchCards(token, maxResults = 50) {
  const response = await fetch(
    `${BASE_URL}/cards?orderBy=desc&sortBy=baseScore&maxResults=${maxResults}&language=FR`,
    { headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchMarketplace(maxResults = 1000) {
  const response = await fetch(
    `${BASE_URL}/marketplace?orderBy=desc&sortBy=date&maxResults=${maxResults}&language=FR`
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchTransactions(token, maxResults = 1000) {
  const response = await fetch(
    `${BASE_URL}/transactions?maxResults=${maxResults}&language=FR`,
    { headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchAthletes(sport = null, level = null) {
  const params = new URLSearchParams();
  if (sport) params.set("sport", sport);
  if (level) params.set("level", level);
  const qs = params.toString();
  const response = await fetch(`${BASE_URL}/athletes${qs ? `?${qs}` : ""}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchArticles(athleteId, limit = 20) {
  const params = new URLSearchParams({ limit });
  if (athleteId) params.set("athlete_id", athleteId);
  const response = await fetch(`${BASE_URL}/articles?${params.toString()}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function contributeTransactions(token) {
  const response = await fetch(`${BASE_URL}/cards-registry/contribute`, {
    method: "POST",
    headers: { Authorization: token },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchRecentSales(limit = 200) {
  const response = await fetch(`${BASE_URL}/cards-registry/sales?limit=${limit}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchSalesStats(days = 30) {
  const response = await fetch(`${BASE_URL}/cards-registry/stats?days=${days}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchProfile(token) {
  const response = await fetch(
    `${BASE_URL}/profile`,
    { headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}
