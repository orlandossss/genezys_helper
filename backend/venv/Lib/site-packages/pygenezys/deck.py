class DeckResource:
    def __init__(self, client):
        self.client = client
        self.url = f"{client.BASE_URL}/api-prod-fantasy-game-service/decks"

    def _build_cards_summaries(self, card_info):
        cards_summaries = []
        for card in card_info:
            card_id = card['id']
            card_collection_id = card['collectionId']
            equipment_id = card.get('equipmentId', None)

            if equipment_id is None:
                card_summary = {
                    "id": card_id,
                    "collectionId": card_collection_id,
                    "isLinkedUser": True
                }
            else:
                card_summary = {
                    "id": card_id,
                    "collectionId": card_collection_id,
                    "equipmentId": equipment_id,
                    "isLinkedUser": True
                }
            cards_summaries.append(card_summary)
        return cards_summaries

    def _submit(self, card_info, compatibility):
        payload = {
            "cardsSummary": self._build_cards_summaries(card_info),
            "actif": True,
            "userId": self.client.user.get_user_id(),
            "compatibility": compatibility,
        }
        response = self.client._request("PUT", self.url, json=payload, params={"language": "FR"})
        return response['message']

    def build_deck_division(self, card_info):
        return self._submit(card_info, {
            "leagueType": "division",
            "hash": "7d06fd0f44eceb7a9731e554f8dda962",
        })

    def build_deck_commun_cup(self, card_info):
        return self._submit(card_info, {
            "leagueType": "cup",
            "data": {"acceptedRarities": ["common"]},
            "hash": "ebd84812d34db552d0e49d8b77ac2da2",
        })

    def build_deck_limited_cup(self, card_info):
        return self._submit(card_info, {
            "leagueType": "cup",
            "data": {"acceptedRarities": ["common", "Limited"]},
            "hash": "35492e16883de04d62263ac46ccc7648",
        })

    def build_deck_rare_cup(self, card_info):
        return self._submit(card_info, {
            "leagueType": "cup",
            "data": {"acceptedRarities": ["common", "Limited", "Rare"]},
            "hash": "30ae6f71f9b1faaa705a0331cb9fbeff",
        })

    def build_deck_epic_cup(self, card_info):
        return self._submit(card_info, {
            "leagueType": "cup",
            "data": {"acceptedRarities": ["common", "Limited", "Rare", "Epic"]},
            "hash": "1d2ed7708f26e5caa8a82b869c1cbcf8",
        })

    def build_deck_legendary_cup(self, card_info):
        return self._submit(card_info, {
            "leagueType": "cup",
            "data": {"acceptedRarities": ["common", "Limited", "Rare", "Epic", "Legendary"]},
            "hash": "9b882b4a63286502953292996298ecb8",
        })
