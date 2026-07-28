class RankingResource:
    def __init__(self, client):
        self.client = client

    def _parse_player(self, player):
        return {
            'score': player['score'],
            'name': player['pseudo'],
            'userId': player['userId'],
            'matchplayed': player['nbMatchLaunch'],
            'position': player['position'],
        }

    def cup_leaderboard(self, cup_id, max_results=10):
        url = f"{self.client.BASE_URL}/api-prod-leaderboard-service/rankings/cup/overview"
        data = self.client._request("GET", url, params={
            "cupId": cup_id, "topx": max_results, "aroundx": "10", "language": "FR",
        })

        personal_info = data['data']['me']
        own_info_cup = {
            'score': personal_info['score'],
            'matchplayed': personal_info['nbMatchLaunch'],
            'position': personal_info['position'],
        }

        players_cup = [self._parse_player(player) for player in data['data']['top']]

        return own_info_cup, players_cup

    def division_leaderboard(self, max_results):
        url = f"{self.client.BASE_URL}/api-prod-leaderboard-service/rankings/division/overview"
        data = self.client._request("GET", url, params={
            "topx": max_results, "aroundx": "10", "language": "FR",
        })

        personal_info = data['data']['me']
        own_info_division = {
            'score': personal_info['score'],
            'matchplayed': personal_info['nbMatchLaunch'],
            'position': personal_info['position'],
            'division_rank': personal_info['divisionRank'],
        }

        players_div = [self._parse_player(player) for player in data['data']['top']]

        return own_info_division, players_div
