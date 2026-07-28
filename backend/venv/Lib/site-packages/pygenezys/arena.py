class ArenaResource:
    def __init__(self, client):
        self.client = client

    def get_arena_info(self):
        url = f"{self.client.BASE_URL}/api-prod-fantasy-game-service/arenatheme/current"
        data = self.client._request("GET", url, params={"language": "FR"})
        name_arena = data['data']['title']
        category = data['data']['levels']
        attribut = data['data']['characteristics']
        return name_arena, category, attribut
