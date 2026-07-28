from fastapi import APIRouter, Header
from pygenezys import GenezysClient

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

@router.get("")
async def get_marketplace(
    authorization: str = Header(None),
    orderBy: str = "desc",
    sortBy: str = "date",
    maxResults: int = 20,
    language: str = "FR",
):
    client = GenezysClient(authorization or "")
    return client.market.get_market(order=orderBy, sortBy=sortBy, max_results=maxResults)
