"""
Jobs Router
Handles job creation with AI-generated embeddings for skill matching.
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
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
    """Job creation payload"""
    company_id: str  # UUID string from database
    title: str
    description: str
    min_score: int = 50  # Integer percentage (0-100)
    
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
    
    - Generates semantic embedding vector from job description
    - Stores job in Supabase with required_skills_embedding
    - Returns created job details
    
    Args:
        job: Job creation payload with company_id, title, description, min_score
        
    Returns:
        Success message with job details
    """
    try:
        # Step 1: Validate company exists
        company_check = supabase.table('companies').select('id, name').eq('id', job.company_id).execute()
        
        if not company_check.data or len(company_check.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Company with id {job.company_id} not found"
            )
        
        company_name = company_check.data[0]['name']
        
        # Step 2: Validate description content
        if not job.description or len(job.description.strip()) < 20:
            raise HTTPException(
                status_code=400,
                detail="Job description must be at least 20 characters long"
            )
        
        # Step 3: Generate embedding for the job description
        try:
            embedding = get_embedding(job.description)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate embedding: {str(e)}"
            )
        
        # Step 4: Insert job into Supabase
        try:
            job_data = {
                'company_id': job.company_id,
                'title': job.title,
                'description': job.description,
                'min_score': job.min_score,
                'required_skills_embedding': embedding
            }
            
            response = supabase.table('jobs').insert(job_data).execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create job in database"
                )
            
            created_job = response.data[0]
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Database insert failed: {str(e)}"
            )
        
        # Step 5: Return success response
        return {
            "status": "success",
            "message": "Job created successfully",
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
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
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
