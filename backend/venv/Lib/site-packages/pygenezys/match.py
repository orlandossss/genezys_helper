class MatchResource:
    def __init__(self, client):
        self.client = client

    def run_division_match(self):
        url = f"{self.client.BASE_URL}/api-prod-fantasy-game-service/match/division/new"
        return self.client._request("GET", url, params={"language": "FR"})

    def run_cup_match(self, cup_id):
        url = f"{self.client.BASE_URL}/api-prod-fantasy-game-service/match/cup/new"
        return self.client._request("GET", url, params={"cupId": cup_id, "language": "FR"})
