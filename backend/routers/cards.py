from fastapi import APIRouter, Header
from pygenezys import GenezysClient

router = APIRouter(prefix="/cards", tags=["cards"])

@router.get("")
async def get_cards(
    authorization: str = Header(...),
    orderBy: str = "desc",
    sortBy: str = "baseScore",
    maxResults: int = 50,
    language: str = "FR",
):
    client = GenezysClient(authorization)
    return client.my_cards.get_my_cards(order=orderBy, sortBy=sortBy, max_results=maxResults)
