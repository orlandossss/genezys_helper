class MatchHistoryResource:
    def __init__(self, client):
        self.client = client

    def _parse_deck_cards(self, cards_equipments):
        cards = []
        for card in cards_equipments:
            cards.append({
                'card_name': card['card']['clientName'],
                'score': card['score'],
                'health': card['card']['health']['points'],
            })
        return cards

    def get_match_history(self, numberof_matches=10):
        url = f"{self.client.BASE_URL}/api-prod-fantasy-game-service/match/division"
        data = self.client._request("GET", url, params={"maxResults": numberof_matches, "language": "FR"})
        match_history = data['data']['matches']

        match_history_info = []
        for match in match_history:
            match_history_info.append({
                'date': match['created'],
                'detail_match': match['matchSimulation'],
                'victory': match['userWin'],
                'opponnent_name': match['adversaryPseudo'],
                'opponent_score': match['adversaryDeck']['scoreDeck'],
                'opponent_id': match['adversaryId'],
                'user_score': match['userDeck']['scoreDeck'],
                'userdeck': self._parse_deck_cards(match['userDeck']['cardsEquipments']),
                'opponentdeck': self._parse_deck_cards(match['adversaryDeck']['cardsEquipments']),
            })

        return match_history_info
