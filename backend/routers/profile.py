from fastapi import APIRouter, Header
from pygenezys import GenezysClient

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("")
async def get_profile(
    authorization: str = Header(...),
):
    client = GenezysClient(authorization)
    return client.user.get_all_info()
