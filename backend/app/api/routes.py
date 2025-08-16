from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import supabase

router = APIRouter(prefix="/api", tags=["api"])

# Security scheme for JWT tokens
security = HTTPBearer()

@router.get("/")
def read_root():
    return {"message": "pucio!"}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user information"""
    try:
        print(f"🔍 Received token: {credentials.credentials[:20]}...")
        # Verify the JWT token with Supabase
        user = supabase.auth.get_user(credentials.credentials)
        print(f"✅ Supabase response: {user}")
        return user.user
    except Exception as e:
        print(f"❌ Error verifying token: {str(e)}")
        
        # Check if it's a session issue
        if "session_id claim in JWT does not exist" in str(e):
            print("⚠️ Session issue detected - JWT token references non-existent session")
            print("💡 Try getting a fresh JWT token by signing out and back in")
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# for testing 
@router.get("/me")
async def get_my_info(current_user = Depends(get_current_user)):
    return {
        "message": "Authentication successful!",
        "user_id": current_user.id,
        "email": current_user.email,
        "user_metadata": current_user.user_metadata,
        "created_at": current_user.created_at,
        "last_sign_in_at": current_user.last_sign_in_at
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
