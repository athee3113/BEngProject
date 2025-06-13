from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.stage_info import StageInfo
from pydantic import BaseModel
from typing import Optional
import openai
from app.core.config import settings

router = APIRouter()

class StageInfoRequest(BaseModel):
    stage: str
    role: str

class StageInfoResponse(BaseModel):
    explanation: str

@router.post("/generateStageInfo", response_model=StageInfoResponse)
async def generate_stage_info(
    request: StageInfoRequest,
    db: Session = Depends(get_db)
):
    # Validate role
    if request.role not in ['buyer', 'seller']:
        raise HTTPException(status_code=403, detail="Only buyers and sellers can access stage information")

    # Check cache first
    cached_info = db.query(StageInfo).filter(
        StageInfo.stage == request.stage,
        StageInfo.role == request.role
    ).first()

    if cached_info:
        return StageInfoResponse(explanation=cached_info.explanation)

    # Generate new explanation using OpenAI
    try:
        # Configure OpenAI with API key from settings
        openai.api_key = settings.OPENAI_API_KEY
        
        prompt = f"""Explain what happens specifically during the '{request.stage}' stage of a UK house purchase, from the perspective of a {request.role}. 
Focus ONLY on the immediate actions and responsibilities of this specific stage. Do not mention what happens before or after this stage.
Keep the explanation under 100 words and make it clear what the {request.role} needs to do right now. Additionally, provide a rough estimate of how long this stage typically takes in a usual process (e.g., 'This stage typically takes around 2-3 weeks')."""
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant explaining UK property purchase stages. Your explanations should be focused, specific, and only cover the current stage."},
                {"role": "user", "content": prompt}
            ],
            temperature=0  # Ensure deterministic output
        )
        
        explanation = response.choices[0].message.content.strip()

        # Cache the result
        new_stage_info = StageInfo(
            stage=request.stage,
            role=request.role,
            explanation=explanation
        )
        db.add(new_stage_info)
        db.commit()
        db.refresh(new_stage_info)

        return StageInfoResponse(explanation=explanation)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate stage information: {str(e)}")

@router.get("/api/stage-info", response_model=StageInfoResponse)
async def get_stage_info(stage: str, role: str, db: Session = Depends(get_db)):
    # Validate role
    if role not in ['buyer', 'seller']:
        raise HTTPException(status_code=403, detail="Only buyers and sellers can access stage information")

    try:
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = f"Explain in simple terms what typically happens during the '{stage}' stage of a UK house purchase, from the perspective of a {role}. Keep it under 100 words."
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant explaining UK property purchase stages."},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        explanation = response.choices[0].message.content.strip()

        # Overwrite or create the explanation in the database
        cached_info = db.query(StageInfo).filter(
            StageInfo.stage == stage,
            StageInfo.role == role
        ).first()
        if cached_info:
            cached_info.explanation = explanation
        else:
            db.add(StageInfo(stage=stage, role=role, explanation=explanation))
        db.commit()

        return StageInfoResponse(explanation=explanation)
    except Exception as e:
        return StageInfoResponse(explanation=f"[AI ERROR] Could not generate explanation: {str(e)}") 