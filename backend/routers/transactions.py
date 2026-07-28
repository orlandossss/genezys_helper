from fastapi import APIRouter, Header
from pygenezys import GenezysClient

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("")
async def get_transactions(
    authorization: str = Header(...),
    maxResults: int = 1000,
    language: str = "FR",
):
    client = GenezysClient(authorization)
    url = f"{client.BASE_URL}/api-prod-transaction-service/transactions"
    data = client._request("GET", url, params={"maxResults": maxResults, "language": language})
    return data
