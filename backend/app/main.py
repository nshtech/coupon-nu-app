import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

# Interactive docs and the OpenAPI schema stay off in production; set
# ENABLE_API_DOCS=true locally to get /docs back.
_docs_enabled = os.getenv("ENABLE_API_DOCS", "false").lower() == "true"

app = FastAPI(
    title="Willie's Wallet API",
    version="1.0.0",
    docs_url="/docs" if _docs_enabled else None,
    redoc_url=None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

# The only client is the native app, which CORS does not apply to; this is for
# `expo start --web` in development. Auth is a bearer token, never a cookie, so
# browsers are not allowed to send credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.get("/healthz")
def healthz():
    return {"status": "ok"}


app.include_router(api_router)
