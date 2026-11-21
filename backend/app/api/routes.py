import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["api"])

security = HTTPBearer()

# The supabase client is synchronous, so every dependency and route that calls
# it is a plain `def`: FastAPI runs those in a worker thread. An `async def`
# here would block the event loop, and with it every other request, for the
# whole round trip to Supabase.


@router.get("/")
def read_root():
    return {"message": "yo!"}


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifies the Supabase access token with Supabase Auth; never trusts the client."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired session",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        response = supabase.auth.get_user(credentials.credentials)
    except Exception:
        # the reason stays in our logs; the client only learns the token was refused
        logger.info("Rejected access token", exc_info=True)
        raise unauthorized
    if not response or not response.user:
        raise unauthorized
    return response.user


@router.get("/me")
def get_my_info(current_user=Depends(get_current_user)):
    return {
        "message": "Authentication successful!",
        "user_id": current_user.id,
        "email": current_user.email,
    }


@router.delete("/delete-account")
def delete_account(current_user=Depends(get_current_user)):
    """
    Delete the authenticated user's account from Supabase auth
    """
    try:
        supabase.table("coupon_usages").delete().eq("user_id", current_user.id).execute()
        supabase.table("subscriptions").delete().eq("user_id", current_user.id).execute()

        supabase.auth.admin.delete_user(current_user.id)
    except Exception:
        logger.exception("Failed to delete account %s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account",
        )

    return {
        "message": "Account deleted successfully",
        "user_id": current_user.id,
        "email": current_user.email,
    }
