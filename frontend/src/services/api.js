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

export async function fetchCups(token) {
  const response = await fetch(
    `${BASE_URL}/cups?language=FR`,
    { headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchMatchDecks(token) {
  const response = await fetch(
    `${BASE_URL}/match/decks`,
    { headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function optimizeDeck(token, slot) {
  const response = await fetch(
    `${BASE_URL}/match/optimize/${slot}`,
    { method: "POST", headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function launchMatch(token, slot) {
  const response = await fetch(
    `${BASE_URL}/match/launch/${slot}`,
    { method: "POST", headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function fetchCupLeaderboard(token, cupId, topx = 100) {
  const params = new URLSearchParams({ cupId, topx, aroundx: 10, language: "FR" });
  const response = await fetch(
    `${BASE_URL}/leaderboard/cup?${params.toString()}`,
    { headers: { Authorization: token } }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}
