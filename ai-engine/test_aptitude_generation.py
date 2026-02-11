"""
Test script for Aptitude Test Generator
Tests the rule-based aptitude test generation endpoint
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_generate_aptitude_test(company_id: str):
    """
    Test the aptitude test generation endpoint
    
    Args:
        company_id: UUID of the company to generate test for
    """
    print(f"\n{'='*60}")
    print(f"Testing Aptitude Test Generation for Company: {company_id}")
    print(f"{'='*60}\n")
    
    try:
        # Call the generate endpoint
        response = requests.get(f"{BASE_URL}/aptitude/generate/{company_id}")
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            questions = response.json()
            print(f"\n✅ Successfully generated {len(questions)} questions\n")
            
            # Display the questions
            for idx, question in enumerate(questions, 1):
                print(f"Question {idx}:")
                print(f"  ID: {question.get('id')}")
                print(f"  Topic: {question.get('topic', 'N/A')}")
                print(f"  Difficulty: {question.get('difficulty', 'N/A')}")
                print(f"  Content: {question.get('content')[:80]}...")
                print(f"  Options: {len(question.get('options', []))} options")
                print(f"  Has correct_answer: {'correct_answer' in question}")
                print()
            
            # Verify correct_answer is not present
            has_answer = any('correct_answer' in q for q in questions)
            if not has_answer:
                print("✅ Verified: correct_answer field is properly hidden")
            else:
                print("❌ Warning: correct_answer field is still present!")
                
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the API. Make sure the server is running on port 8000.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")


if __name__ == "__main__":
    print("""
    Aptitude Test Generator Test Script
    ====================================
    
    This script tests the rule-based aptitude test generation endpoint.
    
    Prerequisites:
    1. API server must be running (python -m uvicorn main:app --reload)
    2. Supabase database must be accessible
    3. Companies table must have aptitude_config data
    4. Questions table must have questions with topics
    """)
    
    # Example company ID - replace with a valid UUID from your database
    company_id = input("\nEnter Company ID (UUID): ").strip()
    
    if company_id:
        test_generate_aptitude_test(company_id)
    else:
        print("❌ No company ID provided")
        print("\nTo test with default behavior (10 random questions):")
        print("Make sure a company exists without aptitude_config or with empty config")
