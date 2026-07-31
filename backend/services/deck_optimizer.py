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
