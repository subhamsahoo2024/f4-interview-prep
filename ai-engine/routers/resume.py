"""
Resume Upload Router
Handles resume file uploads, text extraction, and embedding generation.
"""

import os
from fastapi import APIRouter, UploadFile, Form, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv

from services.resume_parser import extract_text_from_pdf, get_embedding

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY")
)

# Create router
router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)


@router.post("/upload")
async def upload_resume(
    file: UploadFile,
    user_id: str = Form(...)
):
    """
    Upload and process a resume PDF file.
    
    - Extracts text from PDF
    - Generates semantic embedding vector
    - Updates user profile in Supabase
    
    Args:
        file: PDF resume file
        user_id: User's profile ID
        
    Returns:
        Success message with processing details
    """
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported"
            )
        
        # Step 1: Read file content
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )
        
        # Step 2: Extract text from PDF
        try:
            text = extract_text_from_pdf(content)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to extract text: {str(e)}"
            )
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Resume does not contain enough text content"
            )
        
        # Step 3: Generate embedding vector
        try:
            vector = get_embedding(text)
        except ValueError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate embedding: {str(e)}"
            )
        
        # Step 4: Update Supabase profiles table
        try:
            response = supabase.table('profiles').update({
                'skills_embedding': vector,
                'resume_url': 'uploaded'
            }).eq('id', user_id).execute()
            
            # Check if update was successful
            if not response.data:
                raise HTTPException(
                    status_code=404,
                    detail=f"User profile with id '{user_id}' not found"
                )
        
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database update failed: {str(e)}"
            )
        
        # Step 5: Return success response
        return {
            "status": "success",
            "message": "Resume processed successfully",
            "details": {
                "user_id": user_id,
                "filename": file.filename,
                "text_length": len(text),
                "embedding_dimensions": len(vector)
            }
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


@router.get("/status/{user_id}")
async def get_resume_status(user_id: str):
    """
    Check if a user has uploaded a resume.
    
    Args:
        user_id: User's profile ID
        
    Returns:
        Resume status information
    """
    try:
        response = supabase.table('profiles').select(
            'resume_url, skills_embedding'
        ).eq('id', user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail=f"User profile with id '{user_id}' not found"
            )
        
        profile = response.data[0]
        has_resume = profile.get('resume_url') == 'uploaded'
        has_embedding = profile.get('skills_embedding') is not None
        
        return {
            "user_id": user_id,
            "has_resume": has_resume,
            "has_embedding": has_embedding,
            "status": "complete" if (has_resume and has_embedding) else "incomplete"
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch status: {str(e)}"
        )
