from fastapi import APIRouter, Header
from pygenezys import GenezysClient

router = APIRouter(prefix="/cups", tags=["cups"])

@router.get("")
async def get_cups(
    authorization: str = Header(...),
    language: str = "FR",
):
    client = GenezysClient(authorization)
    url = f"{client.BASE_URL}/api-prod-fantasy-game-service/cups"
    data = client._request("GET", url, params={"language": language})
    return data
