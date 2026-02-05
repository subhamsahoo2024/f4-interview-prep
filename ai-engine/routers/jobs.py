"""
Jobs Router
Handles job creation with AI-generated embeddings for skill matching.
"""

import os
import re
from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator, ValidationInfo
from supabase import create_client, Client
from dotenv import load_dotenv

from services.resume_parser import get_embedding

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY")
)

# Create router
router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


class JobCreate(BaseModel):
    """
    Job creation payload with robust validation and text sanitization.
    
    Ensures that description text is clean, free of control characters,
    and safe for JSON encoding. Handles company_id as string from frontend.
    """
    company_id: str  # Received as string from React <select>, converted to UUID later
    title: str
    description: str
    min_score: int = 50  # Integer percentage (0-100)
    
    @field_validator('description')
    @classmethod
    def sanitize_description(cls, v: str, info: ValidationInfo) -> str:
        """
        Sanitize the description field by removing control characters.
        
        Strips out invisible control characters (hex codes \\x00-\\x1f) that
        can break JSON parsing. Replaces newlines and tabs with spaces.
        
        Args:
            v: Raw description text from frontend
            info: Pydantic validation context
            
        Returns:
            Sanitized description string safe for JSON encoding
            
        Raises:
            ValueError: If description is empty after sanitization
        """
        if not v:
            raise ValueError('Description cannot be empty')
        
        # Step 1: Replace actual newlines and tabs with spaces
        sanitized = v.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
        
        # Step 2: Remove all control characters (hex codes \x00-\x1f)
        # This regex matches any character in the ASCII control range
        sanitized = re.sub(r'[\x00-\x1f]', '', sanitized)
        
        # Step 3: Collapse multiple spaces into single space
        sanitized = re.sub(r'\s+', ' ', sanitized)
        
        # Step 4: Trim leading/trailing whitespace
        sanitized = sanitized.strip()
        
        # Step 5: Validate minimum length after sanitization
        if len(sanitized) < 20:
            raise ValueError(
                f'Description must be at least 20 characters after sanitization. Got {len(sanitized)} characters.'
            )
        
        return sanitized
    
    @field_validator('title')
    @classmethod
    def sanitize_title(cls, v: str, info: ValidationInfo) -> str:
        """Sanitize job title by removing control characters."""
        if not v:
            raise ValueError('Title cannot be empty')
        
        # Remove control characters and collapse spaces
        sanitized = re.sub(r'[\x00-\x1f]', '', v)
        sanitized = re.sub(r'\s+', ' ', sanitized).strip()
        
        if len(sanitized) < 3:
            raise ValueError('Title must be at least 3 characters long')
        
        return sanitized
    
    @field_validator('min_score')
    @classmethod
    def validate_min_score(cls, v: int, info: ValidationInfo) -> int:
        """Ensure min_score is within valid range."""
        if not 0 <= v <= 100:
            raise ValueError('min_score must be between 0 and 100')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "company_id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Senior Python Developer",
                "description": "We are looking for an experienced Python developer with expertise in FastAPI, machine learning, and cloud technologies. Strong knowledge of PostgreSQL and REST APIs required.",
                "min_score": 70
            }
        }


@router.post("/create")
async def create_job(job: JobCreate):
    """
    Create a new job with AI-generated skill embeddings.
    
    Features:
    - Robust text sanitization (strips control characters)
    - Type-safe company_id conversion (string → UUID)
    - Detailed error logging to console
    - Clear error messages to frontend
    
    Args:
        job: Job creation payload with company_id, title, description, min_score
        
    Returns:
        Success message with job details
        
    Raises:
        HTTPException: With detailed error message on validation/processing failures
    """
    print(f"\n{'='*60}")
    print(f"[JOB CREATE] Starting job creation process")
    print(f"  - Company ID: {job.company_id}")
    print(f"  - Title: {job.title}")
    print(f"  - Description length: {len(job.description)} chars")
    print(f"  - Min Score: {job.min_score}")
    print(f"{'='*60}\n")
    
    try:
        # Step 1: Validate company exists
        print(f"[STEP 1] Validating company ID: {job.company_id}")
        try:
            company_check = supabase.table('companies').select('id, name').eq('id', job.company_id).execute()
            
            if not company_check.data or len(company_check.data) == 0:
                print(f"[ERROR] Company not found: {job.company_id}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Company with id {job.company_id} not found"
                )
            
            company_name = company_check.data[0]['name']
            print(f"[SUCCESS] Company validated: {company_name}")
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"[ERROR] Company validation failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to validate company: {str(e)}"
            )
        
        # Step 2: Generate embedding for the job description
        print(f"[STEP 2] Generating AI embedding for job description...")
        print(f"  - Sanitized description: {job.description[:100]}...")
        try:
            embedding = get_embedding(job.description)
            print(f"[SUCCESS] Embedding generated: {len(embedding)} dimensions")
            
        except Exception as e:
            print(f"[ERROR] Embedding generation failed: {str(e)}")
            print(f"  - Error type: {type(e).__name__}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate AI embedding: {str(e)}"
            )
        
        # Step 3: Insert job into Supabase
        print(f"[STEP 3] Inserting job into database...")
        try:
            job_data = {
                'company_id': job.company_id,  # Keep as string UUID
                'title': job.title,
                'description': job.description,
                'min_score': job.min_score,
                'required_skills_embedding': embedding
            }
            
            print(f"  - Job data prepared: {list(job_data.keys())}")
            response = supabase.table('jobs').insert(job_data).execute()
            
            if not response.data:
                print(f"[ERROR] Database returned no data after insert")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create job in database (no data returned)"
                )
            
            created_job = response.data[0]
            print(f"[SUCCESS] Job created with ID: {created_job['id']}")
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"[ERROR] Database insert failed: {str(e)}")
            print(f"  - Error type: {type(e).__name__}")
            raise HTTPException(
                status_code=500,
                detail=f"Database insert failed: {str(e)}"
            )
        
        # Step 4: Return success response
        success_response = {
            "status": "success",
            "message": "Job created successfully with AI-generated embeddings",
            "job": {
                "id": created_job['id'],
                "company_id": job.company_id,
                "company_name": company_name,
                "title": job.title,
                "description": job.description,
                "min_score": job.min_score,
                "embedding_dimensions": len(embedding)
            }
        }
        
        print(f"\n{'='*60}")
        print(f"[SUCCESS] Job creation completed successfully!")
        print(f"  - Job ID: {created_job['id']}")
        print(f"  - Company: {company_name}")
        print(f"{'='*60}\n")
        
        return success_response
    
    except HTTPException:
        # Re-raise HTTP exceptions (already logged above)
        raise
    
    except Exception as e:
        # Catch any unexpected errors
        print(f"\n{'!'*60}")
        print(f"[CRITICAL ERROR] Unexpected error in job creation")
        print(f"  - Error: {str(e)}")
        print(f"  - Type: {type(e).__name__}")
        print(f"{'!'*60}\n")
        
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during job creation: {str(e)}"
        )


@router.get("/list")
async def list_jobs(company_id: str = None):
    """
    List all jobs, optionally filtered by company.
    
    Args:
        company_id: Optional company ID to filter jobs
        
    Returns:
        List of jobs with company information
    """
    try:
        # Build query
        query = supabase.table('jobs').select('*, companies(name)')
        
        if company_id:
            query = query.eq('company_id', company_id)
        
        response = query.execute()
        
        # Format response
        jobs = []
        for job in (response.data or []):
            jobs.append({
                'id': job['id'],
                'company_id': job['company_id'],
                'company_name': job['companies']['name'] if job.get('companies') else 'Unknown',
                'title': job['title'],
                'description': job['description'],
                'min_score': job['min_score'],
                'created_at': job.get('created_at')
            })
        
        return {
            "status": "success",
            "count": len(jobs),
            "jobs": jobs
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch jobs: {str(e)}"
        )


@router.delete("/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job by ID.
    
    Args:
        job_id: Job ID to delete
        
    Returns:
        Success message
    """
    try:
        response = supabase.table('jobs').delete().eq('id', job_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail=f"Job with id {job_id} not found"
            )
        
        return {
            "status": "success",
            "message": f"Job {job_id} deleted successfully"
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete job: {str(e)}"
        )
