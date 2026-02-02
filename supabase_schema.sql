-- ============================================================================
-- Supabase Schema for Smart Placement Assistant
-- ============================================================================
-- This schema includes tables for managing users, companies, jobs, interviews,
-- and AI-powered question/answer flows with vector embeddings for skill matching.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
-- Enable the pgvector extension for storing and querying AI embeddings
-- This allows us to store vector representations of skills and requirements
-- and perform similarity searches for candidate-job matching.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. ENUMS
-- ============================================================================
-- Define custom enum types for consistent data validation across the application
-- ============================================================================

-- User roles: Defines whether a user is an admin or a candidate
CREATE TYPE user_role AS ENUM ('admin', 'candidate');

-- Interview round types: Defines the different stages of the interview process
CREATE TYPE round_type AS ENUM ('aptitude', 'coding', 'gd', 'hr');

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles: Extended user information linked to Supabase auth.users
-- ----------------------------------------------------------------------------
-- Stores additional profile data for authenticated users including their role,
-- resume, and a vector embedding of their skills for AI-powered matching.
-- ----------------------------------------------------------------------------

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'candidate',
    full_name TEXT NOT NULL,
    resume_url TEXT,
    skills_embedding vector(1536), -- OpenAI ada-002 embedding dimension
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on skills_embedding for faster similarity searches
CREATE INDEX profiles_skills_embedding_idx ON profiles USING ivfflat (skills_embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- companies: Organization information
-- ----------------------------------------------------------------------------
-- Stores details about companies that are posting jobs and conducting interviews.
-- ----------------------------------------------------------------------------

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- jobs: Job postings with AI-powered skill matching
-- ----------------------------------------------------------------------------
-- Each job has a vector embedding of required skills for intelligent candidate
-- matching and a minimum score threshold for qualification.
-- ----------------------------------------------------------------------------

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    required_skills_embedding vector(1536), -- Vector representation of required skills
    min_score INTEGER NOT NULL DEFAULT 0, -- Minimum score to pass (0-100)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on required_skills_embedding for faster similarity searches
CREATE INDEX jobs_required_skills_embedding_idx ON jobs USING ivfflat (required_skills_embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- interview_flows: Defines the sequence of interview rounds for each job
-- ----------------------------------------------------------------------------
-- Stores the order in which interview rounds should be conducted as a JSONB array.
-- Example: ["aptitude", "coding", "hr"]
-- ----------------------------------------------------------------------------

CREATE TABLE interview_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
    round_order JSONB NOT NULL, -- Array of round_type values, e.g., ["aptitude", "coding", "gd", "hr"]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- questions: Interview questions categorized by round type
-- ----------------------------------------------------------------------------
-- Stores questions for different interview rounds. Questions can be company-specific
-- or global (when company_id is NULL). Each question has a type and difficulty level.
-- ----------------------------------------------------------------------------

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type round_type NOT NULL,
    content TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- NULL means global question
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX questions_type_idx ON questions(type);
CREATE INDEX questions_company_id_idx ON questions(company_id);
CREATE INDEX questions_difficulty_idx ON questions(difficulty);

-- ----------------------------------------------------------------------------
-- interviews: Tracks individual interview sessions
-- ----------------------------------------------------------------------------
-- Each interview represents a candidate's attempt at a job application,
-- tracking overall status and cumulative score across all rounds.
-- ----------------------------------------------------------------------------

CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'passed', 'failed', 'cancelled')),
    total_score FLOAT DEFAULT 0.0, -- Aggregate score across all rounds (0-100)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX interviews_user_id_idx ON interviews(user_id);
CREATE INDEX interviews_job_id_idx ON interviews(job_id);
CREATE INDEX interviews_status_idx ON interviews(status);

-- ----------------------------------------------------------------------------
-- round_logs: Detailed logs for each interview round
-- ----------------------------------------------------------------------------
-- Captures the performance, transcript, and AI-generated feedback for each
-- round of an interview. This allows for granular analysis and review.
-- ----------------------------------------------------------------------------

CREATE TABLE round_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    round_type round_type NOT NULL,
    score FLOAT DEFAULT 0.0, -- Score for this specific round (0-100)
    transcript TEXT, -- Full transcript or recording of the round
    ai_feedback TEXT, -- AI-generated feedback and analysis
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX round_logs_interview_id_idx ON round_logs(interview_id);
CREATE INDEX round_logs_round_type_idx ON round_logs(round_type);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables to ensure data access is controlled by policies.
-- Initially, we allow read access to all authenticated users.
-- These policies should be refined based on specific role-based requirements.
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Basic RLS Policies: Allow read access to authenticated users
-- ----------------------------------------------------------------------------
-- NOTE: These are permissive policies for initial setup.
-- You should refine these based on your security requirements:
-- - Admins should have full access
-- - Candidates should only see their own data
-- - Public job listings might be readable by anyone
-- ----------------------------------------------------------------------------

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Allow read access to all profiles" 
    ON profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Companies: Public read access
CREATE POLICY "Allow read access to all companies" 
    ON companies FOR SELECT 
    USING (true);

-- Jobs: Public read access for active jobs
CREATE POLICY "Allow read access to all jobs" 
    ON jobs FOR SELECT 
    USING (true);

-- Interview Flows: Public read access
CREATE POLICY "Allow read access to all interview flows" 
    ON interview_flows FOR SELECT 
    USING (true);

-- Questions: Public read access (but you may want to restrict this later)
CREATE POLICY "Allow read access to all questions" 
    ON questions FOR SELECT 
    USING (true);

-- Interviews: Users can only see their own interviews
CREATE POLICY "Users can read their own interviews" 
    ON interviews FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interviews" 
    ON interviews FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews" 
    ON interviews FOR UPDATE 
    USING (auth.uid() = user_id);

-- Round Logs: Users can only see logs for their own interviews
CREATE POLICY "Users can read their own round logs" 
    ON round_logs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = round_logs.interview_id 
            AND interviews.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create round logs for their own interviews" 
    ON round_logs FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM interviews 
            WHERE interviews.id = round_logs.interview_id 
            AND interviews.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS (Optional but recommended)
-- ============================================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_flows_updated_at BEFORE UPDATE ON interview_flows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_round_logs_updated_at BEFORE UPDATE ON round_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
-- Next Steps:
-- 1. Copy this entire SQL script
-- 2. Go to your Supabase project dashboard
-- 3. Navigate to SQL Editor
-- 4. Paste and execute this script
-- 5. Verify all tables, policies, and indexes are created successfully
-- ============================================================================
