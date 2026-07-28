class AveragePriceResource:
    def __init__(self, client):
        self.client = client

    def average_prices(self):
        url = f"{self.client.BASE_URL}/api-prod-marketplace-service/stats/rarity-sale-prices"
        data = self.client._request("GET", url, params={"language": "FR"})
        all_prices = data['data']['averagePrices']

        for type in all_prices:
            if type['rarity'] == 'Limited':
                limited_price = type['averagePrice']
            elif type['rarity'] == 'Epic':
                epic_price = type['averagePrice']
            elif type['rarity'] == 'Legendary':
                legendary_price = type['averagePrice']
            elif type['rarity'] == 'Rare':
                rare_price = type['averagePrice']

        return limited_price, rare_price, epic_price, legendary_price
