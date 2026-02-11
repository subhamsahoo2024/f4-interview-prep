"""
Aptitude Router
Handles rule-based aptitude test generation based on company configuration.
"""

import os
import random
from typing import Any, Dict, List, Optional
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
    prefix="/aptitude",
    tags=["Aptitude"]
)


class Question(BaseModel):
    """Response model for a question (without correct answer)"""
    id: str
    question: str
    options: List[str]
    topic: Optional[str] = None
    


@router.get("/generate/{company_id}", response_model=List[Question])
async def generate_aptitude_test(company_id: str) -> List[Dict[str, Any]]:
    """
    Generate a rule-based aptitude test for a given company.
    
    Optimized Logic:
    1. Fetch the company's aptitude_config (JSONB with topic: count mapping)
    2. If config is empty/null, fetch a batch of 50 questions and randomly sample 10
    3. Otherwise, for each topic/count pair:
       - Fetch a reasonable batch (3x requested or 50, whichever is larger)
       - Randomly sample the requested count from the batch in Python
       - This is more efficient than fetching ALL questions while maintaining good randomness
    4. Validate that we have questions (return 404 if empty)
    5. Shuffle the final paper one more time to thoroughly mix topics
    6. Return questions without the 'correct_answer' field
    
    Args:
        company_id: UUID of the company
        
    Returns:
        List of questions with id, question, options (as list), and topic
        (correct_answer is excluded for test-taking purposes)
    """
    try:
        # Step 1: Fetch the company's aptitude_config
        company_response = supabase.table("companies").select("aptitude_config").eq("id", company_id).single().execute()
        
        if not company_response.data:
            raise HTTPException(status_code=404, detail=f"Company with id {company_id} not found")
        
        aptitude_config = company_response.data.get("aptitude_config")
        final_paper = []
        
        # Step 2: Check if config is empty or null
        if not aptitude_config or len(aptitude_config) == 0:
            # Return 10 random questions from any topic
            # Fetch a reasonable batch and randomly sample from it
            questions_response = supabase.table("questions").select("*").limit(50).execute()
            
            if questions_response.data:
                available_questions = questions_response.data
                # Randomly sample up to 10 questions
                num_to_select = min(10, len(available_questions))
                final_paper = random.sample(available_questions, num_to_select)
        else:
            # Step 3: Loop through the config and fetch questions by topic
            # Hybrid approach: Fetch a reasonable batch per topic, then sample in Python
            for topic, count in aptitude_config.items():
                try:
                    # Fetch a batch of questions for this topic (limit to 3x requested or 50, whichever is larger)
                    # This is more efficient than fetching ALL questions but still provides good randomness
                    batch_size = max(count * 3, 50)
                    topic_questions_response = supabase.table("questions").select("*").eq("topic", topic).limit(batch_size).execute()
                    
                    if topic_questions_response.data:
                        available_questions = topic_questions_response.data
                        # Randomly sample the requested count from the batch
                        num_to_select = min(count, len(available_questions))
                        if num_to_select > 0:
                            selected_questions = random.sample(available_questions, num_to_select)
                            final_paper.extend(selected_questions)
                except Exception as topic_error:
                    # If a specific topic query fails, log it but continue with other topics
                    print(f"Warning: Failed to fetch questions for topic '{topic}': {str(topic_error)}")
                    continue
        
        # Step 4: Check if we have any questions
        if not final_paper or len(final_paper) == 0:
            raise HTTPException(
                status_code=404, 
                detail="No questions found matching this company's configuration."
            )
        
        # Step 5: Shuffle the final paper to mix topics
        random.shuffle(final_paper)
        
        # Step 6: Remove the 'correct_answer' field from each question
        sanitized_questions = []
        for question in final_paper:
            # Convert options from dict to list
            options_dict = question.get("options", {})
            options_list = []
            if isinstance(options_dict, dict):
                # Extract values in order A, B, C, D
                options_list = [
                    options_dict.get("A", ""),
                    options_dict.get("B", ""),
                    options_dict.get("C", ""),
                    options_dict.get("D", "")
                ]
            else:
                options_list = options_dict if isinstance(options_dict, list) else []
            
            # Create a copy without the correct_answer field
            sanitized_question = {
                "id": question.get("id"),
                "question": question.get("question"),
                "options": options_list,
                "topic": question.get("topic")
            }
            sanitized_questions.append(sanitized_question)
        
        return sanitized_questions
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating aptitude test: {str(e)}"
        )
