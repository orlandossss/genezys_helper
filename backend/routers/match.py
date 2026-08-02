from fastapi import APIRouter, Header, HTTPException
from pygenezys import GenezysClient
from pygenezys.deck import DeckResource

from services.deck_optimizer import (
    available_item_quantities,
    eligible_cards_for_slot,
    pick_best_deck,
    pick_best_items,
    score_card_with_item,
)

router = APIRouter(prefix="/match", tags=["match"])

SLOTS = ["division", "cup_common", "cup_limited", "cup_rare", "cup_epic", "cup_legendary"]

BUILDER_METHOD = {
    "division": "build_deck_division",
    "cup_common": "build_deck_commun_cup",
    "cup_limited": "build_deck_limited_cup",
    "cup_rare": "build_deck_rare_cup",
    "cup_epic": "build_deck_epic_cup",
    "cup_legendary": "build_deck_legendary_cup",
}

HASH_TO_SLOT = dict(DeckResource.SLOT_HASHES)


def _cup_availability(client):
    """{slot: cup_id} for cup slots with a status=='ready' cup this week."""
    cups = client.cup.get_all_info().get("data", [])
    availability = {}
    for cup in cups:
        if cup.get("status") != "ready":
            continue
        slot = HASH_TO_SLOT.get(cup.get("compatibilityHash"))
        if slot and slot != "division":
            availability[slot] = cup["id"]
    return availability


def _card_display_fields(card, boosted_levels, boosted_characteristics, item=None):
    if not card:
        return {}
    try:
        score = score_card_with_item(card, boosted_levels, boosted_characteristics, item)
    except (KeyError, TypeError):
        score = None
    return {
        "clientName": card.get("clientName"),
        "rarity": card.get("rarity") or card.get("type"),
        "level": card.get("level"),
        "health": (card.get("health") or {}).get("points"),
        "baseScore": card.get("baseScore"),
        "score": score,
        "image": card.get("image"),
        "equipmentTitle": item.get("title") if item else None,
    }


def _total_score(cards):
    scores = [c["score"] for c in cards if c.get("score") is not None]
    return sum(scores) if scores else None


def _enrich_deck(cards_summary, cards_by_id, items_by_id, boosted_levels, boosted_characteristics):
    enriched = []
    for summary in cards_summary:
        card = cards_by_id.get(summary.get("id"))
        equipment_id = summary.get("equipmentId")
        item = items_by_id.get(equipment_id) if equipment_id else None
        enriched.append({
            "id": summary.get("id"),
            "collectionId": summary.get("collectionId"),
            "equipmentId": equipment_id,
            **_card_display_fields(card, boosted_levels, boosted_characteristics, item),
        })
    return enriched


def _enrich_picked(cards, item_assignment, items_by_id, boosted_levels, boosted_characteristics):
    enriched = []
    for card in cards:
        item_id = item_assignment.get(card.get("id"))
        item = items_by_id.get(item_id) if item_id else None
        enriched.append({
            "id": card.get("id"),
            "collectionId": card.get("collectionId"),
            "equipmentId": item_id,
            **_card_display_fields(card, boosted_levels, boosted_characteristics, item),
        })
    return enriched


def _fetch_last_match(client, slot, cup_id):
    if slot == "division":
        url = f"{client.BASE_URL}/api-prod-fantasy-game-service/match/division"
        params = {"maxResults": 1, "language": "FR"}
    else:
        url = f"{client.BASE_URL}/api-prod-fantasy-game-service/match/cup"
        params = {"maxResults": 1, "cupId": cup_id, "language": "FR"}
    data = client._request("GET", url, params=params)
    matches = data.get("data", {}).get("matches", [])
    return matches[0] if matches else None


@router.get("/decks")
async def get_decks(authorization: str = Header(...)):
    client = GenezysClient(authorization)

    current_decks = client.deck.get_current_decks()
    all_cards = client.my_cards.get_my_cards(max_results=100)["data"]["cardsList"]
    cards_by_id = {c["id"]: c for c in all_cards}
    equipment_items = client.items.get_items_info(item_type="equipment")
    items_by_id = {i["id"]: i for i in equipment_items}
    cup_availability = _cup_availability(client)
    _, boosted_levels, boosted_characteristics = client.arena.get_arena_info()

    result = {}
    for slot in SLOTS:
        cup_id = cup_availability.get(slot)
        cards = _enrich_deck(
            current_decks.get(slot, []), cards_by_id, items_by_id, boosted_levels, boosted_characteristics
        )
        result[slot] = {
            "league_type": "division" if slot == "division" else "cup",
            "cup_id": cup_id,
            "available": True if slot == "division" else cup_id is not None,
            "cards": cards,
            "total_score": _total_score(cards),
        }
    return result


@router.post("/optimize/{slot}")
async def optimize_deck(slot: str, authorization: str = Header(...)):
    if slot not in SLOTS:
        raise HTTPException(status_code=404, detail=f"Unknown slot '{slot}'")

    client = GenezysClient(authorization)

    cup_id = None
    if slot != "division":
        cup_availability = _cup_availability(client)
        cup_id = cup_availability.get(slot)
        if cup_id is None:
            raise HTTPException(status_code=400, detail=f"No active cup for '{slot}' this week")

    all_cards = client.my_cards.get_my_cards(max_results=100)["data"]["cardsList"]
    eligible = eligible_cards_for_slot(slot, all_cards)

    _, boosted_levels, boosted_characteristics = client.arena.get_arena_info()
    best = pick_best_deck(eligible, boosted_levels, boosted_characteristics)

    equipment_items = client.items.get_items_info(item_type="equipment")
    items_by_id = {i["id"]: i for i in equipment_items}

    current_decks = client.deck.get_current_decks()
    freed_item_ids = [c.get("equipmentId") for c in current_decks.get(slot, []) if c.get("equipmentId")]
    availability = available_item_quantities(equipment_items, freed_item_ids)
    item_assignment = pick_best_items(best, equipment_items, boosted_levels, boosted_characteristics, availability)

    best_with_equipment = [
        {**card, "equipmentId": item_assignment[card["id"]]} if card["id"] in item_assignment else card
        for card in best
    ]

    build = getattr(client.deck, BUILDER_METHOD[slot])
    message = build(best_with_equipment)

    cards = _enrich_picked(best, item_assignment, items_by_id, boosted_levels, boosted_characteristics)
    return {
        "message": message,
        "cup_id": cup_id,
        "cards": cards,
        "total_score": _total_score(cards),
    }


@router.post("/launch/{slot}")
async def launch_match(slot: str, authorization: str = Header(...)):
    if slot not in SLOTS:
        raise HTTPException(status_code=404, detail=f"Unknown slot '{slot}'")

    client = GenezysClient(authorization)

    cup_id = None
    if slot == "division":
        client.match.run_division_match()
    else:
        cup_availability = _cup_availability(client)
        cup_id = cup_availability.get(slot)
        if cup_id is None:
            raise HTTPException(status_code=400, detail=f"No active cup for '{slot}' this week")
        client.match.run_cup_match(cup_id)

    return {"result": _fetch_last_match(client, slot, cup_id)}
