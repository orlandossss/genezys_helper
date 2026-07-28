import React from "react";
import { Database, X } from "lucide-react";

export default function ConsentModal({ onAccept, onDecline, loading }) {
  return (
    <div className="consent-overlay" role="dialog" aria-modal="true" aria-label="Data sharing consent">
      <div className="consent-panel">
        <div className="consent-header">
          <span className="consent-icon" aria-hidden="true">
            <Database size={18} />
          </span>
          <p className="consent-prompt">// COMMUNITY_DATA_MODULE</p>
        </div>

        <h2 className="consent-title">
          BUILD THE <span className="page-title-accent">PRICE DATABASE</span>
        </h2>

        <p className="consent-body">
          Share your transaction history to help the community track real sale
          prices for every card. Your wallet address is never stored — only
          card IDs, prices, and dates.
        </p>

        <ul className="consent-list">
          <li>Adds sale prices to the shared card registry</li>
          <li>Helps others see what cards actually sell for</li>
          <li>One-time sync — no ongoing access granted</li>
        </ul>

        <div className="consent-actions">
          <button
            className="fetch-btn consent-btn-share"
            onClick={onAccept}
            disabled={loading}
          >
            {loading ? "Syncing…" : "Share & Connect"}
          </button>
          <button
            className="clear-btn consent-btn-skip"
            onClick={onDecline}
            disabled={loading}
          >
            <X size={12} aria-hidden="true" />
            Connect without sharing
          </button>
        </div>
      </div>
    </div>
  );
}
