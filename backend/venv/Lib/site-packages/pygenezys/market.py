class MarketResource:
    def __init__(self, client):
        self.client = client

    def get_market(self, order='desc', sortBy='date', max_results=20):
        url = f"{self.client.BASE_URL}/api-prod-marketplace-service/listings"
        querystring = {"orderBy": order, "sortBy": sortBy, "maxResults": max_results, "language": "FR"}
        return self.client._request("GET", url, params=querystring)
