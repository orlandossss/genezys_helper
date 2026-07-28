class RewardsResource:
    def __init__(self, client):
        self.client = client

    def get_daily_rewards_info(self):
        url = f"{self.client.BASE_URL}/api-prod-fantasy-game-service/daily-rewards/current"
        data = self.client._request("GET", url, params={"language": "FR"})

        id = data['data']['id']
        reward_type = data['data']['rewardType']
        reward_quantity = data['data']['rewardQuantity']
        return id, reward_type, reward_quantity

    def get_missions_info(self):
        url = f"{self.client.BASE_URL}/api-prod-fantasy-game-service/missions/daily"
        data = self.client._request("GET", url, params={"language": "FR"})

        missions_info = []
        for mission in data['data']['milestones']:
            missions_info.append({
                'title': mission['title'],
                'reward_quantity': mission['rewardQuantity'],
                'action_quantity': mission['actionQuantity'],
                'reward_type': mission['rewardType'],
            })

        missions_info.append({
            'title': 'Finir toutes les misions',
            'reward_quantity': data['data']['rewardQuantity'],
            'reward_type': data['data']['rewardType'],
        })

        return missions_info
