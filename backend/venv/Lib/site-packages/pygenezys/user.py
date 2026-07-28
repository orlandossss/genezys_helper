class UserResource:
    def __init__(self, client):
        self.client = client

    def _fetch(self):
        url = f"{self.client.BASE_URL}/api-prod-user-service/users/connected"
        return self.client._request("GET", url, params={"language": "FR"})

    def get_gnz(self):
        return self._fetch()['data']['points']['nbTokens']

    def get_gems(self):
        return self._fetch()['data']['points']['nbGems']

    def get_activity_points(self):
        return self._fetch()['data']['points']['tokensToClaim']['nbActivityPointsOnGoingPeriod']

    def get_airdrop(self):
        return self._fetch()['data']['points']['tokensToClaim']['nbTokens']

    def get_username(self):
        return self._fetch()['data']['pseudo']

    def get_user_id(self):
        return self._fetch()['data']['id']

    def get_all_info(self):
        return self._fetch()
