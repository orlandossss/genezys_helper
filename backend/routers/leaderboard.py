from fastapi import APIRouter, Header, Query
from pygenezys import GenezysClient

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("/division")
async def get_division_leaderboard(
    authorization: str = Header(...),
    topx: int = 100,
    aroundx: int = 0,
    language: str = "FR",
):
    client = GenezysClient(authorization)
    url = f"{client.BASE_URL}/api-prod-leaderboard-service/rankings/division/overview"
    data = client._request("GET", url, params={
        "topx": topx, "aroundx": aroundx, "language": language,
    })
    return data

@router.get("/cup")
async def get_cup_leaderboard(
    authorization: str = Header(...),
    cupId: str = Query(..., description="Cup ID to fetch leaderboard for"),
    topx: int = 100,
    aroundx: int = 10,
    language: str = "FR",
):
    client = GenezysClient(authorization)
    url = f"{client.BASE_URL}/api-prod-leaderboard-service/rankings/cup/overview"
    data = client._request("GET", url, params={
        "cupId": cupId, "topx": topx, "aroundx": aroundx, "language": language,
    })
    return data
