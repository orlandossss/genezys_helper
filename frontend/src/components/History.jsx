import React, { useState } from "react";

const ORIGIN_LABELS = {
  "buy-on-secondary-market": "Achat Marché Secondaire",
  "buy-on-primary-market": "Achat Marché Primaire",
  "claim-token-from-activity-points": "Réclamation Token",
  "fantasy-item": "Achat Article",
  "sell-on-secondary-market": "Vente Marché Secondaire",
  "booster-opening": "Ouverture Booster",
  "reward": "Récompense",
};

const CURRENCY_LABELS = {
  "gnz-token": "GNZ",
  "genezys-gems": "Gems",
};

const RARITY_COLORS = {
  Epic: "#ffd54f",
  Rare: "#a78bfa",
  Limited: "#5c9eff",
  Legendary: "#ffffff",
  Common: "#666",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function CardMini({ card, price, currency }) {
  const rarityColor = RARITY_COLORS[card?.rarity] ?? "var(--text-2)";
  const thumbnail = card?.image?.urlThumbnail;
  const currencyLabel = CURRENCY_LABELS[currency] ?? currency ?? "GNZ";

  return (
    <div className="tx-card-mini">
      <div className="tx-card-mini-img">
        {thumbnail
          ? <img src={thumbnail} alt={card?.cardTitle} />
          : <div className="tx-card-mini-placeholder">?</div>
        }
      </div>
      <div className="tx-card-mini-info">
        <p className="tx-card-mini-name">{card?.cardTitle ?? card?.clientName ?? "—"}</p>
        <p className="tx-card-mini-collection">{card?.collectionName ?? "—"}</p>
        <p className="tx-card-mini-rarity" style={{ color: rarityColor }}>
          {card?.rarity ?? "—"}
        </p>
        <p className="tx-card-mini-score">{card?.baseScore != null ? `${card.baseScore} pts` : ""}</p>
        {price != null && (
          <p className="tx-card-mini-price">
            Payé: <span>{price}</span> {currencyLabel}
          </p>
        )}
      </div>
    </div>
  );
}

function ProductDetail({ product, cardMap }) {
  const type = product.productType;

  if (type === "secondary-market" || type === "primary-market") {
    const listings = product.product?.listings ?? [];
    return (
      <div className="tx-product">
        <p className="tx-product-type">
          {type === "secondary-market" ? "Carte(s) achetée(s)" : "Pack acheté"}
        </p>
        {listings.map((l, i) => {
          const card = cardMap?.[l.item?.id];
          return card ? (
            <CardMini key={i} card={card} price={l.price} currency={product.currency} />
          ) : (
            <p key={i} className="tx-product-line">
              Carte #{l.item?.number} — {l.price} {CURRENCY_LABELS[product.currency] ?? "pièces"}
            </p>
          );
        })}
        <p className="tx-product-amount">Total: {product.amount}</p>
      </div>
    );
  }

  if (type === "fantasy-item") {
    const items = product.product?.items ?? [];
    return (
      <div className="tx-product">
        <p className="tx-product-type">Article(s) acheté(s)</p>
        {items.map((it, i) => {
          const title = it.data?.title?.FR ?? it.data?.title?.EN ?? "Article";
          return (
            <p key={i} className="tx-product-line">
              {title} × {it.quantity} — {it.price} chacun
            </p>
          );
        })}
        <p className="tx-product-amount">Total: {product.amount}</p>
      </div>
    );
  }

  if (type === "claim-token-from-activity-points") {
    const p = product.product;
    return (
      <div className="tx-product">
        <p className="tx-product-type">Réclamation token</p>
        <p className="tx-product-line">
          {p?.nbActivityPoints} pts activité → {p?.nbTokens} GNZ
        </p>
      </div>
    );
  }

  return (
    <div className="tx-product">
      <p className="tx-product-type">{type}</p>
    </div>
  );
}

function statusClass(s) {
  if (s === "success") return "status-success";
  if (s === "pending") return "status-pending";
  return "status-failed";
}

function TransactionRow({ tx, cardMap }) {
  const [expanded, setExpanded] = useState(false);
  const originLabel = ORIGIN_LABELS[tx.origin] ?? tx.origin ?? "—";
  const currencyLabel = CURRENCY_LABELS[tx.currency] ?? tx.currency ?? "";
  const hasAmount = tx.totalWithDiscount != null;

  return (
    <>
      <tr className="tx-row" onClick={() => setExpanded((v) => !v)}>
        <td>{formatDate(tx.created)}</td>
        <td>{originLabel}</td>
        <td>
          <span className={`status-badge ${statusClass(tx.globalStatus)}`}>
            {tx.globalStatus}
          </span>
        </td>
        <td>
          {hasAmount ? (
            <>
              <span style={{ fontWeight: 700, color: "var(--amber)" }}>{tx.totalWithDiscount}</span>
              {" "}<span style={{ color: "var(--text-2)", fontSize: "0.72rem" }}>{currencyLabel}</span>
            </>
          ) : "—"}
        </td>
        <td style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>{expanded ? "▲" : "▼"}</td>
      </tr>
      {expanded && (
        <tr className="tx-row">
          <td colSpan={5} className="tx-expand-row">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {(tx.products ?? []).map((p, i) => (
                <ProductDetail key={i} product={p} cardMap={cardMap} />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function History({ data, cardMap }) {
  const transactions = data?.data?.transactionsList ?? [];
  if (transactions.length === 0) return <p className="empty-state">Aucune transaction trouvée.</p>;

  return (
    <>
      <p className="section-meta">{transactions.length} transactions</p>
      <table className="tx-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Origine</th>
            <th>Statut</th>
            <th>Montant</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} cardMap={cardMap} />
          ))}
        </tbody>
      </table>
    </>
  );
}
