"""
Resume Parser Service
Extracts text from PDF resumes and generates embeddings for skill matching.
"""

import io
import re
from PyPDF2 import PdfReader
from sentence_transformers import SentenceTransformer

# Initialize the sentence transformer model globally (loads only once)
# Using all-MiniLM-L6-v2: lightweight, fast, and good for semantic similarity
model = SentenceTransformer('all-MiniLM-L6-v2')


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        file_bytes: PDF file content as bytes
        
    Returns:
        Extracted and cleaned text from all pages
    """
    try:
        # Create a PDF reader from bytes
        pdf_file = io.BytesIO(file_bytes)
        pdf_reader = PdfReader(pdf_file)
        
        # Extract text from all pages
        text_content = []
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)
        
        # Combine all pages
        full_text = "\n".join(text_content)
        
        # Clean up whitespace
        full_text = re.sub(r'\s+', ' ', full_text)  # Replace multiple spaces/newlines with single space
        full_text = full_text.strip()
        
        return full_text
    
    except Exception as e:
        raise ValueError(f"Error extracting text from PDF: {str(e)}")


def get_embedding(text: str) -> list:
    """
    Generate semantic embedding vector from text using sentence-transformers.
    
    Args:
        text: Input text to encode
        
    Returns:
        List of floats representing the embedding vector (384 dimensions)
    """
    try:
        # Encode text to embedding vector
        embedding = model.encode(text)
        
        # Convert numpy array to list for JSON serialization
        return embedding.tolist()
    
    except Exception as e:
        raise ValueError(f"Error generating embedding: {str(e)}")


def extract_skills(text: str) -> list:
    """
    Extract potential skills from resume text (optional enhancement).
    
    Args:
        text: Resume text
        
    Returns:
        List of identified skills
    """
    # Common technical skills to look for
    common_skills = [
        'python', 'java', 'javascript', 'react', 'node.js', 'fastapi',
        'sql', 'postgresql', 'mongodb', 'aws', 'docker', 'kubernetes',
        'machine learning', 'deep learning', 'tensorflow', 'pytorch',
        'git', 'agile', 'scrum', 'rest api', 'graphql'
    ]
    
    text_lower = text.lower()
    found_skills = [skill for skill in common_skills if skill in text_lower]
    
    return found_skills
