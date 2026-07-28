class ChallengesResource:
    def __init__(self, client):
        self.client = client

    def get_challenges_info(self):
        url = f"{self.client.BASE_URL}/api-prod-challenge-service/challenges"
        data = self.client._request("GET", url, params={"language": "FR"})

        challenge_info = []
        for challenge in data['data']:
            challenge_info.append({
                'name': challenge['title'],
                'athlete': challenge['clientName'],
                'total_entries': challenge['nbTotalEntries'],
                'start_date': challenge['challengeStartAt'],
                'end_date': challenge['challengeEndAt'],
            })

        return challenge_info
