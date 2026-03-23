from fastapi import FastAPI, APIRouter, Header
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
import requests


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
load_dotenv(ROOT_DIR.parent / 'admin' / '.env')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models - Simplified for static site
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str


class DeleteAccountRequest(BaseModel):
    confirm_text: str

# Basic routes - keeping minimal functionality
@api_router.get("/")
async def root():
    return {"message": "LearnED Static API - Admin functionality removed"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Static LearnED API is running"}

# Simple contact form endpoint (no database storage)
@api_router.post("/contact")
async def contact_form(contact_data: dict):
    # In a static setup, you might want to use a service like EmailJS or similar
    # For now, just return success
    return {"success": True, "message": "Contact form submitted successfully"}


@api_router.post("/delete-account")
async def delete_account(payload: DeleteAccountRequest, authorization: str = Header(default="")):
    if payload.confirm_text.strip().upper() != "DELETE":
        return {
            "success": False,
            "message": "Please type DELETE exactly to confirm account deletion."
        }

    if not authorization.startswith("Bearer "):
        return {"success": False, "message": "Missing authorization token."}

    user_jwt = authorization.replace("Bearer ", "", 1).strip()
    if not user_jwt:
        return {"success": False, "message": "Invalid authorization token."}

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("REACT_APP_SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    cron_shared_secret = os.getenv("CRON_SHARED_SECRET")

    if not supabase_url or not service_role_key:
        logger.error("Missing Supabase server configuration for delete-account endpoint")
        return {"success": False, "message": "Server configuration is incomplete."}

    try:
        auth_response = requests.get(
            f"{supabase_url}/auth/v1/user",
            headers={
                "apikey": service_role_key,
                "Authorization": f"Bearer {user_jwt}",
            },
            timeout=15,
        )

        if auth_response.status_code != 200:
            return {"success": False, "message": "Invalid or expired login session."}

        auth_user = auth_response.json()
        user_id = auth_user.get("id")
        email = auth_user.get("email")

        if not user_id:
            return {"success": False, "message": "Unable to identify logged in user."}

        candidate_secrets = []
        if cron_shared_secret:
            candidate_secrets.append(cron_shared_secret)
        candidate_secrets.append(service_role_key)

        unique_secrets = list(dict.fromkeys(candidate_secrets))

        function_response = None
        function_data = {}
        for secret in unique_secrets:
            function_response = requests.post(
                f"{supabase_url}/functions/v1/process-due-account-purges",
                headers={
                    "Authorization": f"Bearer {secret}",
                    "apikey": service_role_key,
                    "Content-Type": "application/json",
                },
                json={"user_id": user_id, "email": email},
                timeout=30,
            )

            try:
                function_data = function_response.json()
            except ValueError:
                function_data = {"raw": function_response.text}

            if function_response.status_code == 200:
                break

        if not function_response or function_response.status_code != 200:
            if function_response and function_response.status_code == 401:
                return {
                    "success": False,
                    "message": "Deletion service unauthorized. Backend CRON_SHARED_SECRET must match edge function CRON_SHARED_SECRET.",
                    "error": function_data,
                }

            return {
                "success": False,
                "message": "Deletion service returned an error.",
                "error": function_data,
            }

        return {
            "success": True,
            "message": "Account deletion request processed successfully.",
            "data": function_data,
        }
    except requests.RequestException as exc:
        logger.exception("Delete account request failed: %s", exc)
        return {"success": False, "message": "Unable to reach deletion service."}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)