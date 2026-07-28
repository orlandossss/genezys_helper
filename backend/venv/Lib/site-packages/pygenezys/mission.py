class MissionResource:
    def __init__(self, client):
        self.client = client

    def get_missions(self):
        url = f"{self.client.BASE_URL}/api-prod-fantasy-game-service/missions/daily"
        data = self.client._request("GET", url, params={"language": "FR"})

        all_missions_rewards = [data['data']['rewardType'], data['data']['rewardQuantity']]

        missions_info = []
        for mission in data['data']['milestones']:
            missions_info.append({
                'title': mission['title'],
                'reward_quantity': mission['rewardQuantity'],
                'action_quantity': mission['actionQuantity'],
                'reward_type': mission['rewardType'],
            })

        return all_missions_rewards, missions_info
