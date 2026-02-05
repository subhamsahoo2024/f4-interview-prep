"""
Test script to verify robust job creation with messy input.
Tests control characters, newlines, tabs, and edge cases.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_job_creation():
    """Test job creation with various edge cases."""
    
    print("="*70)
    print("TESTING ROBUST JOB CREATION WITH MESSY INPUT")
    print("="*70)
    
    # Test 1: Job description with newlines and tabs
    test_cases = [
        {
            "name": "Normal Job Description",
            "payload": {
                "company_id": "PASTE_YOUR_COMPANY_UUID_HERE",
                "title": "Senior Python Developer",
                "description": "We are looking for an experienced Python developer with expertise in FastAPI, machine learning, and cloud technologies.",
                "min_score": 70
            }
        },
        {
            "name": "Job Description with Newlines",
            "payload": {
                "company_id": "PASTE_YOUR_COMPANY_UUID_HERE",
                "title": "Full Stack Engineer",
                "description": """Looking for a Full Stack Engineer with:
                - 5+ years experience
                - React and Node.js expertise
                - Strong problem-solving skills""",
                "min_score": 65
            }
        },
        {
            "name": "Job Description with Tabs",
            "payload": {
                "company_id": "PASTE_YOUR_COMPANY_UUID_HERE",
                "title": "Data Scientist",
                "description": "Requirements:\tPython\tML\tDeep Learning\tNLP\tComputer Vision",
                "min_score": 80
            }
        },
        {
            "name": "Job Description with Mixed Control Characters",
            "payload": {
                "company_id": "PASTE_YOUR_COMPANY_UUID_HERE",
                "title": "DevOps Engineer\t(Remote)",
                "description": "We need:\n\n1. AWS expertise\r\n2. Docker & Kubernetes\n3. CI/CD pipelines\t\t4. Terraform\n\nBenefits:\n- Remote work\n- Health insurance",
                "min_score": 75
            }
        },
        {
            "name": "Job Description from Textarea (Realistic)",
            "payload": {
                "company_id": "PASTE_YOUR_COMPANY_UUID_HERE",
                "title": "Machine Learning Engineer",
                "description": """We are seeking a talented Machine Learning Engineer to join our AI team.

Key Responsibilities:
- Design and implement ML models
- Optimize model performance
- Deploy models to production

Required Skills:
- Python, TensorFlow, PyTorch
- Strong mathematics background
- Experience with cloud platforms (AWS/GCP)

Nice to Have:
- PhD in CS/ML
- Published research papers
- Open source contributions

Location: San Francisco, CA (Hybrid)
Salary: $150k - $200k""",
                "min_score": 85
            }
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{'='*70}")
        print(f"TEST {i}: {test['name']}")
        print(f"{'='*70}")
        
        print(f"\nOriginal Description (first 100 chars):")
        print(repr(test['payload']['description'][:100]))
        
        try:
            response = requests.post(
                f"{BASE_URL}/jobs/create",
                json=test['payload'],
                headers={"Content-Type": "application/json"}
            )
            
            print(f"\nStatus Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ SUCCESS!")
                print(f"   - Job ID: {data['job']['id']}")
                print(f"   - Title: {data['job']['title']}")
                print(f"   - Description length: {len(data['job']['description'])} chars")
                print(f"   - Embedding dimensions: {data['job']['embedding_dimensions']}")
                print(f"   - Sanitized description (first 100 chars):")
                print(f"     {data['job']['description'][:100]}")
            else:
                print(f"❌ FAILED!")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
    
    print(f"\n{'='*70}")
    print("TESTING COMPLETE")
    print(f"{'='*70}\n")


def test_validation_errors():
    """Test that validators properly reject invalid input."""
    
    print("="*70)
    print("TESTING VALIDATION ERRORS")
    print("="*70)
    
    invalid_cases = [
        {
            "name": "Empty Description",
            "payload": {
                "company_id": "PASTE_YOUR_COMPANY_UUID_HERE",
                "title": "Test Job",
                "description": "",
                "min_score": 50
            }
        },
        {
            "name": "Description Too Short",
            "payload": {
                "company_id": "PASTE_YOUR_COMPANY_UUID_HERE",
                "title": "Test Job",
                "description": "Too short",
                "min_score": 50
            }
        },
        {
            "name": "Invalid Min Score (Too High)",
            "payload": {
                "company_id": "PASTE_YOUR_COMPANY_UUID_HERE",
                "title": "Test Job",
                "description": "This is a valid job description with enough characters to pass validation.",
                "min_score": 150
            }
        },
        {
            "name": "Invalid Min Score (Negative)",
            "payload": {
                "company_id": "PASTE_YOUR_COMPANY_UUID_HERE",
                "title": "Test Job",
                "description": "This is a valid job description with enough characters to pass validation.",
                "min_score": -10
            }
        }
    ]
    
    for i, test in enumerate(invalid_cases, 1):
        print(f"\n{'='*70}")
        print(f"VALIDATION TEST {i}: {test['name']}")
        print(f"{'='*70}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/jobs/create",
                json=test['payload'],
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 422:
                print(f"✅ CORRECTLY REJECTED (422)")
                data = response.json()
                if 'detail' in data:
                    print(f"   Validation errors:")
                    if isinstance(data['detail'], list):
                        for error in data['detail']:
                            print(f"     - {error.get('loc', [])}: {error.get('msg', '')}")
                    else:
                        print(f"     - {data['detail']}")
            else:
                print(f"⚠️  Unexpected status: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
    
    print(f"\n{'='*70}")
    print("VALIDATION TESTING COMPLETE")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    print("\n" + "="*70)
    print("JOB CREATION ROBUSTNESS TEST SUITE")
    print("="*70)
    print("\n⚠️  NOTE: Replace 'PASTE_YOUR_COMPANY_UUID_HERE' with a real company UUID")
    print("    before running this test.\n")
    
    input("Press Enter to start testing... ")
    
    # Run tests
    test_job_creation()
    test_validation_errors()
    
    print("\n✨ All tests completed!\n")
