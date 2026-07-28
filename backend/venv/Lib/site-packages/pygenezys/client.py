import requests
from .arena import ArenaResource
from .average_price import AveragePriceResource
from .challenges import ChallengesResource
from .cup import CupResource
from .deck import DeckResource
from .exceptions import GenezysAPIError, GenezysAuthError, GenezysConnectionError
from .match import MatchResource
from .market import MarketResource
from .match_history import MatchHistoryResource
from .mission import MissionResource
from .my_cards import MyCardsResource
from .ranking import RankingResource
from .rewards import RewardsResource
from .transaction_history import TransactionHistoryResource
from .user import UserResource


class GenezysClient:
    BASE_URL = "https://app.genezys.xyz"

    def __init__(self, token: str):
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "Authorization": token,
            "Referer": "https://app.genezys.xyz/",
            "sec-ch-ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        })

        self.user = UserResource(self)
        self.arena = ArenaResource(self)
        self.average_price = AveragePriceResource(self)
        self.challenges = ChallengesResource(self)
        self.cup = CupResource(self)
        self.deck = DeckResource(self)
        self.match = MatchResource(self)
        self.match_history = MatchHistoryResource(self)
        self.market = MarketResource(self)
        self.mission = MissionResource(self)
        self.my_cards = MyCardsResource(self)
        self.ranking = RankingResource(self)
        self.rewards = RewardsResource(self)
        self.transaction_history = TransactionHistoryResource(self)

    def set_token(self, token: str) -> None:
        self.token = token
        self.session.headers["Authorization"] = token

    def _request(self, method: str, url: str, **kwargs) -> dict:
        try:
            response = self.session.request(method, url, **kwargs)
        except requests.exceptions.RequestException as e:
            raise GenezysConnectionError(str(e)) from e

        if response.status_code in (401, 403):
            raise GenezysAuthError(
                f"Authentication failed ({response.status_code}) - token may be expired",
                status_code=response.status_code,
            )

        if not response.ok:
            raise GenezysAPIError(
                f"Request to {url} failed with status {response.status_code}",
                status_code=response.status_code,
                response_text=response.text,
            )

        try:
            return response.json()
        except ValueError as e:
            raise GenezysAPIError(
                f"Response from {url} was not valid JSON",
                status_code=response.status_code,
                response_text=response.text,
            ) from e
