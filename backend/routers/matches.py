from fastapi import APIRouter, Header
from pygenezys import GenezysClient

router = APIRouter(prefix="/matches", tags=["matches"])

@router.get("")
async def get_matches(
    authorization: str = Header(...),
    maxResults: int = 50,
    language: str = "FR",
):
    client = GenezysClient(authorization)
    url = f"{client.BASE_URL}/api-prod-fantasy-game-service/match/division"
    data = client._request("GET", url, params={"maxResults": maxResults, "language": language})
    return data
