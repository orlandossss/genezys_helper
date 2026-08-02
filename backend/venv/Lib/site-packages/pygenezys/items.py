VALID_ITEM_TYPES = ("consumable", "equipment")


class ItemsResource:
    def __init__(self, client):
        self.client = client

    def _fetch(self):
        url = f"{self.client.BASE_URL}/api-prod-fantasy-game-service/items"
        return self.client._request("GET", url, params={"language": "FR"})

    def get_all_info(self):
        return self._fetch()

    def get_items_info(self, item_type=None):
        if item_type is not None and item_type not in VALID_ITEM_TYPES:
            raise ValueError(
                f"item_type must be one of {VALID_ITEM_TYPES!r} or None, got {item_type!r}"
            )

        items_info = []
        for item in self._fetch()['data']:
            if item_type is not None and item['type'] != item_type:
                continue

            item_stats = item['itemStats']
            items_info.append({
                'id': item['id'],
                'type': item['type'],
                'title': item['title'],
                'quantity': item['quantity'],
                'in_nb_deck_usage': item['inNbDeckUsage'],
                'health_points': item_stats.get('healthPoints'),
                'boosted_characteristics': [
                    {'name': c['name'], 'boost_percentage': c['boostPercentage']}
                    for c in item_stats.get('boostedCharacteristics', [])
                ],
            })

        return items_info
