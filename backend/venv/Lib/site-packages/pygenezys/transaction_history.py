class TransactionHistoryResource:
    def __init__(self, client):
        self.client = client

    def get_transaction_history(self, numberof_matches=10):
        url = f"{self.client.BASE_URL}/api-prod-transaction-service/transactions"
        data = self.client._request("GET", url, params={"maxResults": numberof_matches, "language": "FR"})
        transaction_history = data['data']['transactionsList']

        transaction_history_info = []
        for transaction in transaction_history:
            transaction_history_info.append({
                'date': transaction['created'],
                'type': transaction['origin'],
                'details': transaction['products'],
            })

        return transaction_history_info
