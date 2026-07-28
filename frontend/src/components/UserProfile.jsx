import React from "react";

export default function UserProfile({ data }) {
  const user = data?.data ?? data ?? {};

  const pseudo = user.pseudo ?? user.username ?? user.name ?? "—";
  const email = user.email ?? null;
  const rank = user.rank ?? user.position ?? null;
  const score = typeof user.score === "number" ? user.score : null;
  const level = typeof user.level === "string" || typeof user.level === "number" ? user.level : null;
  const avatar = user.avatar ?? user.image?.url ?? null;

  // Currency is returned as a nested object
  const currency = user.currency ?? {};
  const nbGems = currency.nbGems ?? null;
  const nbPoints = currency.nbPoints ?? null;
  const nbTokens = currency.nbTokens ?? null;
  const tokensToClaim = currency.tokensToClaim ?? null;

  const stats = [
    rank != null && { label: "Rang", value: `#${rank}` },
    score != null && { label: "Score", value: score },
    level != null && { label: "Niveau", value: level },
    nbGems != null && { label: "Gemmes", value: nbGems },
    nbPoints != null && { label: "Points", value: nbPoints },
    nbTokens != null && { label: "Tokens", value: nbTokens },
    tokensToClaim != null && tokensToClaim > 0 && { label: "À Récupérer", value: tokensToClaim },
  ].filter(Boolean);

  return (
    <div className="user-profile-card">
      <div className="user-profile-avatar">
        {avatar
          ? <img src={avatar} alt={pseudo} className="user-avatar-img" />
          : <div className="user-avatar-placeholder">{String(pseudo)[0]?.toUpperCase() ?? "?"}</div>
        }
      </div>
      <div className="user-profile-info">
        <h2 className="user-pseudo">{pseudo}</h2>
        {email && <p className="user-email">{email}</p>}
        {stats.length > 0 && (
          <div className="user-stats-row">
            {stats.map((s) => (
              <div key={s.label} className="user-stat">
                <span className="user-stat-value">{s.value}</span>
                <span className="user-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
