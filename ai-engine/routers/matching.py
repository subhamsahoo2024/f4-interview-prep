"""
Matching Router
Handles job-candidate matching using vector similarity.
"""

import os
import json
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY")
)

# Create router
router = APIRouter(
    prefix="/match",
    tags=["Matching"]
)


class MatchRequest(BaseModel):
    """Match request payload"""
    user_id: str  # UUID from profiles table
    job_id: str   # UUID from jobs table
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "job_id": "660e8400-e29b-41d4-a716-446655440001"
            }
        }


def parse_embedding(embedding) -> list:
    """
    Parse embedding data from database into a Python list of floats.
    
    Handles multiple formats:
    - Already a list of floats: return as-is
    - JSON string: parse with json.loads()
    - String representation of list: parse with json.loads()
    
    Args:
        embedding: Raw embedding data from Supabase
        
    Returns:
        List of floats
        
    Raises:
        ValueError: If embedding cannot be parsed
    """
    if embedding is None:
        raise ValueError("Embedding is None")
    
    # If already a list, check if elements are floats
    if isinstance(embedding, list):
        if len(embedding) > 0 and isinstance(embedding[0], (int, float)):
            return embedding
        # List of strings? Try converting
        try:
            return [float(x) for x in embedding]
        except (ValueError, TypeError) as e:
            raise ValueError(f"Cannot convert list elements to float: {e}")
    
    # If it's a string, try to parse as JSON
    if isinstance(embedding, str):
        try:
            parsed = json.loads(embedding)
            if isinstance(parsed, list):
                return [float(x) for x in parsed]
            else:
                raise ValueError(f"Parsed JSON is not a list: {type(parsed)}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse embedding JSON string: {e}")
    
    # If it's a numpy array, convert to list
    if hasattr(embedding, 'tolist'):
        return embedding.tolist()
    
    raise ValueError(f"Unknown embedding format: {type(embedding)}")


def cosine_similarity(a, b) -> float:
    """
    Calculate cosine similarity between two vectors.
    
    Formula: dot(a, b) / (norm(a) * norm(b))
    
    Args:
        a: First vector (embedding from database - can be list, string, or numpy array)
        b: Second vector (embedding from database - can be list, string, or numpy array)
        
    Returns:
        Cosine similarity score (0.0 to 1.0)
        
    Raises:
        ValueError: If vectors have mismatched dimensions or invalid data
    """
    try:
        # Step 1: Parse embeddings (handles JSON strings from Supabase)
        print(f"[DEBUG] Parsing vector A (type: {type(a).__name__})")
        a_list = parse_embedding(a)
        print(f"[DEBUG] Vector A parsed: {len(a_list)} elements, first: {a_list[0]:.6f}")
        
        print(f"[DEBUG] Parsing vector B (type: {type(b).__name__})")
        b_list = parse_embedding(b)
        print(f"[DEBUG] Vector B parsed: {len(b_list)} elements, first: {b_list[0]:.6f}")
        
        # Step 2: Convert to numpy arrays with explicit float64 dtype
        a_array = np.array(a_list, dtype=np.float64)
        b_array = np.array(b_list, dtype=np.float64)
        
        # Step 3: Validate dimensions
        if a_array.shape != b_array.shape:
            raise ValueError(
                f"Vector dimension mismatch: {a_array.shape} vs {b_array.shape}"
            )
        
        if len(a_array.shape) != 1:
            raise ValueError(
                f"Expected 1D vectors, got shapes: {a_array.shape}, {b_array.shape}"
            )
        
        print(f"[DEBUG] Vectors validated: {len(a_array)} dimensions each")
        
        # Step 4: Calculate norms
        norm_a = np.linalg.norm(a_array)
        norm_b = np.linalg.norm(b_array)
        
        # Handle zero vectors
        if norm_a == 0 or norm_b == 0:
            print(f"[WARNING] Zero vector detected: norm_a={norm_a}, norm_b={norm_b}")
            return 0.0
        
        # Step 5: Calculate dot product and similarity
        dot_product = np.dot(a_array, b_array)
        similarity = dot_product / (norm_a * norm_b)
        
        print(f"[DEBUG] Similarity calculated: {similarity:.6f}")
        
        # Clamp to valid range (floating point errors can cause slight exceeds)
        return max(0.0, min(1.0, float(similarity)))
        
    except (ValueError, TypeError) as e:
        # More specific error for debugging
        print(f"[ERROR] Cosine similarity calculation failed:")
        print(f"  - Error: {str(e)}")
        print(f"  - Vector A type: {type(a)}, length: {len(a) if isinstance(a, (list, tuple, str)) else 'N/A'}")
        print(f"  - Vector B type: {type(b)}, length: {len(b) if isinstance(b, (list, tuple, str)) else 'N/A'}")
        raise ValueError(f"Failed to calculate similarity: {str(e)}")


def generate_analysis(score: float, job_title: str) -> str:
    """
    Generate a human-readable analysis based on the match score.
    
    Args:
        score: Match score percentage (0-100)
        job_title: Title of the job being matched
        
    Returns:
        Analysis string
    """
    if score >= 85:
        return f"Excellent match! Your skills align very well with the {job_title} position. You have a strong chance of success in this role."
    elif score >= 70:
        return f"Good match! Your profile shows solid compatibility with the {job_title} role. Consider highlighting your relevant experience."
    elif score >= 50:
        return f"Moderate match for {job_title}. You have some relevant skills, but may want to develop expertise in key areas mentioned in the job description."
    elif score >= 30:
        return f"Low match for {job_title}. Consider gaining more experience in the required skills before applying, or look for more entry-level positions."
    else:
        return f"Limited match for {job_title}. This role may require significant skill development. Consider exploring related positions that better match your current profile."


@router.post("")
async def calculate_match(request: MatchRequest):
    """
    Calculate the match score between a user's skills and job requirements.
    
    Uses cosine similarity between the user's skills embedding and the job's
    required skills embedding to determine compatibility.
    
    Args:
        request: MatchRequest with user_id and job_id
        
    Returns:
        Match score (0-100%), analysis, and additional details
    """
    print(f"\n{'='*60}")
    print(f"[MATCH CALCULATION] Starting matching process")
    print(f"  - User ID: {request.user_id}")
    print(f"  - Job ID: {request.job_id}")
    print(f"{'='*60}\n")
    
    try:
        # Step 1: Fetch user profile with skills embedding
        print(f"[STEP 1] Fetching user profile...")
        try:
            profile_response = supabase.table('profiles').select(
                'id, full_name, skills_embedding'
            ).eq('id', request.user_id).execute()
            
            if not profile_response.data or len(profile_response.data) == 0:
                print(f"[ERROR] User profile not found: {request.user_id}")
                raise HTTPException(
                    status_code=404,
                    detail=f"User profile with id '{request.user_id}' not found"
                )
            
            profile = profile_response.data[0]
            
            # Check if user has uploaded a resume (has embedding)
            if not profile.get('skills_embedding'):
                print(f"[ERROR] User has no skills embedding")
                raise HTTPException(
                    status_code=400,
                    detail="User has not uploaded a resume yet. Skills embedding is required for matching."
                )
            
            user_embedding = profile['skills_embedding']
            user_name = profile.get('full_name', 'User')
            
            print(f"[SUCCESS] User profile loaded: {user_name}")
            print(f"  - Embedding type: {type(user_embedding).__name__}")
            if isinstance(user_embedding, str):
                print(f"  - Embedding is JSON string (length: {len(user_embedding)} chars)")
            elif isinstance(user_embedding, list):
                print(f"  - Embedding length: {len(user_embedding)} elements")
                if len(user_embedding) > 0:
                    print(f"  - First element type: {type(user_embedding[0]).__name__}")
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"[ERROR] Failed to fetch user profile: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch user profile: {str(e)}"
            )
        
        # Step 2: Fetch job with required skills embedding
        print(f"\n[STEP 2] Fetching job details...")
        try:
            job_response = supabase.table('jobs').select(
                'id, title, description, min_score, required_skills_embedding, company_id, companies(name)'
            ).eq('id', request.job_id).execute()
            
            if not job_response.data or len(job_response.data) == 0:
                print(f"[ERROR] Job not found: {request.job_id}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Job with id '{request.job_id}' not found"
                )
            
            job = job_response.data[0]
            
            if not job.get('required_skills_embedding'):
                print(f"[ERROR] Job has no skills embedding")
                raise HTTPException(
                    status_code=400,
                    detail="Job does not have a skills embedding. Please recreate the job."
                )
            
            job_embedding = job['required_skills_embedding']
            job_title = job['title']
            company_name = job['companies']['name'] if job.get('companies') else 'Unknown'
            min_score = job.get('min_score', 0)
            
            print(f"[SUCCESS] Job loaded: {job_title} at {company_name}")
            print(f"  - Embedding type: {type(job_embedding).__name__}")
            if isinstance(job_embedding, str):
                print(f"  - Embedding is JSON string (length: {len(job_embedding)} chars)")
            elif isinstance(job_embedding, list):
                print(f"  - Embedding length: {len(job_embedding)} elements")
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"[ERROR] Failed to fetch job: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch job: {str(e)}"
            )
        
        # Step 3: Calculate cosine similarity
        print(f"\n[STEP 3] Calculating cosine similarity...")
        try:
            similarity = cosine_similarity(user_embedding, job_embedding)
            print(f"[SUCCESS] Similarity calculated: {similarity:.4f}")
            
        except Exception as e:
            print(f"[ERROR] Similarity calculation failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to calculate similarity: {str(e)}"
            )
        
        # Convert to percentage (0-100)
        match_score = round(similarity * 100, 1)
        print(f"[RESULT] Match score: {match_score}%")
        
        # Step 4: Generate analysis
        analysis = generate_analysis(match_score, job_title)
        
        # Step 5: Determine if user meets minimum threshold
        meets_threshold = match_score >= min_score
        print(f"[THRESHOLD] Min required: {min_score}%, Meets threshold: {meets_threshold}")
        
        success_response = {
            "status": "success",
            "match_score": match_score,
            "analysis": analysis,
            "details": {
                "user_name": user_name,
                "job_title": job_title,
                "company_name": company_name,
                "min_score_required": min_score,
                "meets_threshold": meets_threshold,
                "recommendation": "Apply now!" if meets_threshold else f"Consider improving your profile to meet the {min_score}% threshold."
            }
        }
        
        print(f"\n{'='*60}")
        print(f"[SUCCESS] Matching completed successfully!")
        print(f"  - User: {user_name}")
        print(f"  - Job: {job_title}")
        print(f"  - Score: {match_score}%")
        print(f"{'='*60}\n")
        
        return success_response
    
    except HTTPException:
        raise
    
    except Exception as e:
        print(f"\n{'!'*60}")
        print(f"[CRITICAL ERROR] Unexpected error in matching")
        print(f"  - Error: {str(e)}")
        print(f"  - Type: {type(e).__name__}")
        print(f"{'!'*60}\n")
        
        raise HTTPException(
            status_code=500,
            detail=f"Matching calculation failed: {str(e)}"
        )


@router.get("/status/{user_id}")
async def get_user_match_status(user_id: str):
    """
    Check if a user is ready for job matching (has uploaded resume).
    
    Args:
        user_id: User's profile ID
        
    Returns:
        Status indicating if user can perform matching
    """
    try:
        response = supabase.table('profiles').select(
            'id, full_name, skills_embedding, resume_url'
        ).eq('id', user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"User profile with id '{user_id}' not found"
            )
        
        profile = response.data[0]
        has_embedding = profile.get('skills_embedding') is not None
        has_resume = profile.get('resume_url') is not None
        
        return {
            "user_id": user_id,
            "user_name": profile.get('full_name', 'User'),
            "ready_for_matching": has_embedding,
            "has_resume": has_resume,
            "message": "Ready for job matching!" if has_embedding else "Please upload your resume first to enable job matching."
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user status: {str(e)}"
        )
