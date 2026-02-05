"""
Test script to verify the matching endpoint fix.
Tests that embeddings are properly converted to float arrays.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_match():
    """Test matching endpoint with real user and job IDs."""
    
    print("="*70)
    print("TESTING MATCH ENDPOINT FIX")
    print("="*70)
    
    # These are the IDs from the curl command
    test_data = {
        "user_id": "a610985a-fe96-479b-9bdf-75b71aa5aea1",
        "job_id": "52d89e5a-3e1b-410b-a1b2-a617f03bd900"
    }
    
    print(f"\nTesting with:")
    print(f"  User ID: {test_data['user_id']}")
    print(f"  Job ID: {test_data['job_id']}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/match",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ SUCCESS!")
            print(f"\n{'-'*70}")
            print(f"Match Results:")
            print(f"{'-'*70}")
            print(f"  Match Score: {data['match_score']}%")
            print(f"  User: {data['details']['user_name']}")
            print(f"  Job: {data['details']['job_title']}")
            print(f"  Company: {data['details']['company_name']}")
            print(f"  Min Score Required: {data['details']['min_score_required']}%")
            print(f"  Meets Threshold: {data['details']['meets_threshold']}")
            print(f"\n  Analysis:")
            print(f"  {data['analysis']}")
            print(f"\n  Recommendation:")
            print(f"  {data['details']['recommendation']}")
            print(f"{'-'*70}\n")
            
        elif response.status_code == 404:
            data = response.json()
            print(f"\n❌ NOT FOUND")
            print(f"  {data['detail']}")
            print(f"\n  Possible causes:")
            print(f"  - User ID doesn't exist in profiles table")
            print(f"  - Job ID doesn't exist in jobs table")
            
        elif response.status_code == 400:
            data = response.json()
            print(f"\n⚠️  BAD REQUEST")
            print(f"  {data['detail']}")
            print(f"\n  Possible causes:")
            print(f"  - User hasn't uploaded resume (no embedding)")
            print(f"  - Job doesn't have skills embedding")
            
        elif response.status_code == 500:
            data = response.json()
            print(f"\n❌ SERVER ERROR")
            print(f"  {data['detail']}")
            print(f"\n  Check backend terminal for detailed logs!")
            
        else:
            print(f"\n⚠️  Unexpected status: {response.status_code}")
            print(f"  Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ CONNECTION ERROR")
        print(f"  Could not connect to {BASE_URL}")
        print(f"  Make sure FastAPI server is running:")
        print(f"    cd ai-engine")
        print(f"    python main.py")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")


def test_user_status():
    """Test user match status endpoint."""
    
    print("\n" + "="*70)
    print("TESTING USER STATUS ENDPOINT")
    print("="*70)
    
    user_id = "a610985a-fe96-479b-9bdf-75b71aa5aea1"
    
    try:
        response = requests.get(
            f"{BASE_URL}/match/status/{user_id}",
            headers={"accept": "application/json"}
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ SUCCESS!")
            print(f"\n{'-'*70}")
            print(f"User Status:")
            print(f"{'-'*70}")
            print(f"  User: {data['user_name']}")
            print(f"  Ready for Matching: {data['ready_for_matching']}")
            print(f"  Has Resume: {data['has_resume']}")
            print(f"  Message: {data['message']}")
            print(f"{'-'*70}\n")
        else:
            data = response.json()
            print(f"\n❌ ERROR")
            print(f"  {data['detail']}")
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")


if __name__ == "__main__":
    print("\n" + "="*70)
    print("MATCH ENDPOINT TEST SUITE")
    print("="*70)
    print("\n📝 This test uses the exact user_id and job_id from your curl command")
    print("   to verify the numpy type conversion fix.\n")
    
    input("Press Enter to start testing... ")
    
    # Test matching
    test_match()
    
    # Test user status
    test_user_status()
    
    print("\n✨ Testing completed!\n")
    print("💡 Check the backend terminal for detailed logs showing:")
    print("   - Embedding types (should be list)")
    print("   - First element types (should be float)")
    print("   - Similarity calculation steps\n")
