"""Deck-optimization scoring, ported from pygenezys/examples/best_deck_and_match.py."""

DECK_SIZE = 5

LEVEL_BONUS = {"talent": 50, "champion": 40, "star": 20}
LEVEL_PENALTY = {"talent": -10, "champion": -15, "star": -30}

CUP_ACCEPTED_RARITIES = {
    "cup_common": ["common"],
    "cup_limited": ["common", "Limited"],
    "cup_rare": ["common", "Limited", "Rare"],
    "cup_epic": ["common", "Limited", "Rare", "Epic"],
    "cup_legendary": ["common", "Limited", "Rare", "Epic", "Legendary"],
}


def card_rarity(card):
    # Common cards omit "rarity" entirely and carry "type": "common" instead.
    return card.get("rarity", card.get("type"))


def score_card(card, boosted_levels, boosted_characteristics):
    base_score = card["baseScore"]

    matching_value = sum(
        c["value"] for c in card["characteristics"] if c["name"] in boosted_characteristics
    )
    attribute_bonus = round(base_score * (matching_value * 5) / 100)

    level = card["level"]
    level_modifier = LEVEL_BONUS[level] if level in boosted_levels else LEVEL_PENALTY[level]
    level_bonus = round(base_score * level_modifier / 100)

    health_bonus = round(base_score * 15 / 100)
    performance_bonus = round(base_score * 20 / 100)

    arena_score = base_score + attribute_bonus + level_bonus + health_bonus + performance_bonus

    health_points = card["health"]["points"]
    if health_points < 40:
        health_multiplier = 0.40
    elif health_points < 70:
        health_multiplier = 0.70
    else:
        health_multiplier = 1.0

    return round(arena_score * health_multiplier)


def pick_best_deck(cards, boosted_levels, boosted_characteristics, deck_size=DECK_SIZE):
    scored = [(score_card(c, boosted_levels, boosted_characteristics), c) for c in cards]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [card for _, card in scored[:deck_size]]


def eligible_cards_for_slot(slot, cards):
    if slot == "division":
        return cards
    accepted = CUP_ACCEPTED_RARITIES[slot]
    return [c for c in cards if card_rarity(c) in accepted]


def _boosted_characteristics(characteristics, item):
    """Card characteristics with values inflated by the item's boostPercentage."""
    if not item:
        return characteristics
    boost_by_name = {b["name"]: b["boost_percentage"] for b in item["boosted_characteristics"]}
    return [
        {**c, "value": c["value"] * (1 + boost_by_name[c["name"]] / 100)}
        if c["name"] in boost_by_name else c
        for c in characteristics
    ]


def score_card_with_item(card, boosted_levels, boosted_characteristics, item=None):
    """Same as score_card, but with the card's characteristics inflated by an equipped item first."""
    if not item:
        return score_card(card, boosted_levels, boosted_characteristics)
    boosted_card = {**card, "characteristics": _boosted_characteristics(card["characteristics"], item)}
    return score_card(boosted_card, boosted_levels, boosted_characteristics)


def available_item_quantities(items, freed_item_ids=()):
    """{item_id: remaining equippable copies}, accounting for freed_item_ids no longer in use."""
    freed_counts = {}
    for item_id in freed_item_ids:
        freed_counts[item_id] = freed_counts.get(item_id, 0) + 1

    availability = {}
    for item in items:
        remaining = item["quantity"] - item["in_nb_deck_usage"] + freed_counts.get(item["id"], 0)
        availability[item["id"]] = max(remaining, 0)
    return availability


def pick_best_items(cards, items, boosted_levels, boosted_characteristics, availability):
    """Greedy highest-gain-first assignment of equipment items to cards.

    Returns {card_id: item_id}, only for pairs with a strictly positive score gain.
    """
    base_scores = {card["id"]: score_card(card, boosted_levels, boosted_characteristics) for card in cards}

    candidates = []
    for card in cards:
        base = base_scores[card["id"]]
        for item in items:
            if availability.get(item["id"], 0) <= 0:
                continue
            gain = score_card_with_item(card, boosted_levels, boosted_characteristics, item) - base
            if gain > 0:
                candidates.append((gain, card["id"], item["id"]))

    candidates.sort(key=lambda c: c[0], reverse=True)

    remaining = dict(availability)
    assigned_cards = set()
    assignment = {}
    for _, card_id, item_id in candidates:
        if card_id in assigned_cards or remaining.get(item_id, 0) <= 0:
            continue
        assignment[card_id] = item_id
        assigned_cards.add(card_id)
        remaining[item_id] -= 1

    return assignment
