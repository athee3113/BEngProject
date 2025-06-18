from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from app.core.database import Base, engine  
from app.api.base import router as base_router
from app.api.signup import router as signup_router
from app.api.login import router as login_router
from app.api.upload import router as upload_router
from app.api.property import router as property_router
from app.api.message import router as message_router
from app.api.user import router as user_router
from app.api.stage_info import router as stage_info_router
from app.models.user import User
from app.models.file import File
from app.models.property import Property

# Load environment variables from .env file
load_dotenv()

# Debug: Check if API key is loaded
print("OpenAI API Key loaded:", bool(os.getenv('OPENAI_API_KEY')))

# Create all tables
Base.metadata.create_all(bind=engine)  

app = FastAPI()

# CORS settings (allow all origins for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "https://individual-beng-frontend.onrender.com",  
        "https://individual-beng.vercel.app",  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type"],
)

# Include routers
app.include_router(base_router)
app.include_router(signup_router)
app.include_router(login_router)
app.include_router(upload_router)
app.include_router(property_router)
app.include_router(message_router)
app.include_router(user_router)
app.include_router(stage_info_router)

@app.get("/")
def read_root():
    return {"message": "Backend is running!"}
