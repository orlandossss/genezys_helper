import React, { useState } from "react";

function CollectionGroup({ group }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="collection-lb-group">
      <button
        className="collection-lb-header"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="collection-lb-name">{group.collectionName}</span>
        <span className="collection-lb-count">{group.entries.length} player{group.entries.length !== 1 ? "s" : ""}</span>
        <span className="collection-lb-toggle">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="collection-lb-entries">
          {group.entries.map((entry) => {
            const delta = entry.previousPosition != null
              ? entry.previousPosition - entry.position
              : null;
            const deltaLabel = delta == null ? null
              : delta > 0 ? `▲${delta}`
              : delta < 0 ? `▼${Math.abs(delta)}`
              : "=";
            const deltaCls = delta == null ? "" : delta > 0 ? "delta-up" : delta < 0 ? "delta-down" : "delta-same";

            return (
              <div key={entry.userId ?? entry.pseudo} className="collection-lb-entry">
                <span className="collection-lb-rank">#{entry.position}</span>
                <span className="collection-lb-pseudo">{entry.pseudo}</span>
                {deltaLabel && (
                  <span className={`collection-lb-delta ${deltaCls}`}>{deltaLabel}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CollectionLeaderboard({ data }) {
  const collections = data?.data?.collections ?? [];

  if (collections.length === 0) {
    return <p className="empty-state">No collection leaderboard data.</p>;
  }

  return (
    <>
      <p className="section-meta">{collections.length} active collections</p>
      <div className="collection-lb-grid">
        {collections.map((group) => (
          <CollectionGroup key={group.collectionId} group={group} />
        ))}
      </div>
    </>
  );
}
