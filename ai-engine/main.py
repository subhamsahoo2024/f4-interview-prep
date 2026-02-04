from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import resume, jobs

app = FastAPI(
    title="Smart Placement Assistant API",
    description="AI-powered resume parsing and placement prediction system",
    version="1.0.0"
)

# CORS Configuration - Allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js development server
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(resume.router)
app.include_router(jobs.router)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to Smart Placement Assistant API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
