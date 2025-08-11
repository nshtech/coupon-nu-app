from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["api"])

@router.get("/")
def read_root():
    return {"message": "pucio!"}
