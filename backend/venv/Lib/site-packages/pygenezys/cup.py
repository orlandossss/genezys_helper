class CupResource:
    def __init__(self, client):
        self.client = client

    def _fetch(self):
        url = f"{self.client.BASE_URL}/api-prod-fantasy-game-service/cups"
        return self.client._request("GET", url, params={"language": "FR"})

    def get_available_cups_id(self):
        cups_id = []
        for cup in self._fetch()['data']:
            cups_id.append(cup['id'])
        return cups_id

    def get_available_cups_info(self):
        cups_info = []
        for cup in self._fetch()['data']:
            cups_info.append({
                'id': cup['id'],
                'accepted_rarities': cup['constraints']['acceptedRarities'],
            })
        return cups_info

    def get_all_info(self):
        return self._fetch()
