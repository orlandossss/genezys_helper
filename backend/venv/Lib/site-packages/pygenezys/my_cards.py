class MyCardsResource:
    def __init__(self, client):
        self.client = client

    def get_my_cards(self, order='desc', sortBy='baseScore', max_results=20):
        url = f"{self.client.BASE_URL}/api-prod-collection-service/cards"
        querystring = {"orderBy": order, "sortBy": sortBy, "maxResults": max_results, "language": "FR"}
        return self.client._request("GET", url, params=querystring)
