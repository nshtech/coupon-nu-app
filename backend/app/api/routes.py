import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import supabase

router = APIRouter(prefix="/api", tags=["api"])

security = HTTPBearer()
ENFORCE_NORTHWESTERN_DOMAIN = os.getenv("ENFORCE_NORTHWESTERN_DOMAIN", "true").lower() != "false"

@router.get("/")
def read_root():
    return {"message": "yo!"}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # verify jwt token as legit, if it wasn't it would throw an error -> NO RELIANCE ON FRONTEND
        user = supabase.auth.get_user(credentials.credentials)
        email = (user.user.email or "").lower()
        if ENFORCE_NORTHWESTERN_DOMAIN and not email.endswith("@northwestern.edu"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This app is for Northwestern students only.",
            )
        return user.user
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# testing 
@router.get("/me")
async def get_my_info(current_user = Depends(get_current_user)):
    return {
        "message": "Authentication successful!",
        "user_id": current_user.id,
        "email": current_user.email,
    }



@router.delete("/delete-account")
async def delete_account(current_user = Depends(get_current_user)):
    """
    Delete the authenticated user's account from Supabase auth
    """
    try:

        supabase.table("coupon_usages").delete().eq("user_id", current_user.id).execute()
        supabase.table("subscriptions").delete().eq("user_id", current_user.id).execute()

        supabase.auth.admin.delete_user(current_user.id)
        
        return {
            "message": "Account deleted successfully",
            "user_id": current_user.id,
            "email": current_user.email
        }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )
