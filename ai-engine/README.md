# AI Engine - Smart Placement Assistant

A FastAPI-based backend service for the Smart Placement Assistant. Handles intelligent placement predictions, resume analysis, and company matching using AI/ML algorithms.

## 📋 Prerequisites

- **Python**: 3.9+ (3.11 recommended)
- **pip** or **poetry** package manager
- **Supabase Account**: Database and API access configured

## 🚀 Quick Start

### 1. Install Dependencies

install uv

```bash
pip instll uv
```

Using uv:

```bash
uv sync
```

Or using poetry (if configured):

```bash
poetry install
```

### 2. Configure Environment Variables

Create a `.env` file in the `ai-engine/` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET_KEY=your-secret-key-here

# API Configuration
API_PORT=8000
API_HOST=0.0.0.0
DEBUG=False

# AI/ML Model Configuration
MODEL_PATH=./models/
```

**Environment Variables Explanation:**

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SECRET_KEY` - Secret key for backend operations (bypasses RLS)
- `API_PORT` - Port for FastAPI server (default: 8000)
- `API_HOST` - Host binding (0.0.0.0 for all interfaces)
- `DEBUG` - Debug mode (set to False in production)

### 3. Run Development Server

```bash
uv run main.py
```

The API will be available at [http://localhost:8000](http://localhost:8000)

**Interactive API Docs:**

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 📁 Project Structure

```
ai-engine/
├── main.py                 # FastAPI application entry point
├── pyproject.toml         # Project metadata and dependencies
├── requirements.txt       # Python dependencies (auto-generated)
├── .env                   # Environment variables (git-ignored)
├── models/                # Pre-trained ML models
├── routes/
│   ├── __init__.py
│   ├── placements.py      # Placement prediction endpoints
│   ├── analysis.py        # Resume analysis endpoints
│   └── matching.py        # Company matching endpoints
├── services/
│   ├── __init__.py
│   ├── supabase_client.py # Supabase integration
│   ├── ml_engine.py       # ML/AI model logic
│   └── utils.py           # Utility functions
└── tests/                 # Unit and integration tests
```

## 🔌 Supabase Integration

The AI Engine uses the **Admin Client** pattern for Supabase access:

```python
from supabase import create_client
import os

# Admin client - bypasses RLS
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY")
)

# Fetch data (bypasses RLS)
response = supabase.table("companies").select("*").execute()
```

**Why Admin Client?**

- Backend API needs full database access
- AI Engine processes data that may require RLS bypass
- Ensures consistent data processing across all users

⚠️ **Security Note:** Secret key is server-only and should never be exposed to the client.

## 🤖 AI/ML Features

### Placement Prediction

- Analyzes student profile and company requirements
- Predicts placement probability
- Recommends best-fit companies

### Resume Analysis

- Extracts skills, experience, and qualifications
- Scores resume quality
- Identifies gaps and recommendations

### Company Matching

- Matches students with suitable companies
- Considers cultural fit and technical alignment
- Ranks candidates for each company

## 📚 Available Scripts

```bash
# Run development server
python main.py

# Run with auto-reload (requires watchfiles)
fastapi dev main.py

# Run tests
pytest

# Format code
black .

# Lint code
pylint **/*.py
```

## 🔗 API Endpoints

**Base URL:** `http://localhost:8000/api`

### Placements

- `POST /api/placements/predict` - Predict placement probability
- `GET /api/placements/{student_id}` - Get placement status

### Analysis

- `POST /api/analysis/resume` - Analyze resume
- `GET /api/analysis/{student_id}` - Get analysis results

### Matching

- `POST /api/matching/recommend` - Get company recommendations
- `GET /api/matching/compatibility/{student_id}/{company_id}` - Get compatibility score

See [API Documentation](#) for detailed endpoint specifications.

## 🔐 Database Schema

The AI Engine works with the following tables in Supabase:

```sql
-- Companies
SELECT * FROM companies;
-- Columns: id, name, description, requirements, etc.

-- Students
SELECT * FROM students;
-- Columns: id, name, email, skills, experience, etc.

-- Placements
SELECT * FROM placements;
-- Columns: id, student_id, company_id, status, score, etc.
```

See `../supabase_schema.sql` for full schema.

## 🔗 Integration with Web Client

The Web Client communicates with the AI Engine via HTTP requests:

```typescript
// Example: Call placement prediction from Next.js
const response = await fetch("http://localhost:8000/api/placements/predict", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${supabaseToken}`,
  },
  body: JSON.stringify({ student_id: 123 }),
});

const result = await response.json();
```

See the main [README.md](../README.md) for full integration details.

## 📖 Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [scikit-learn Documentation](https://scikit-learn.org) (if using ML)

## 🚀 Deployment

### Deploy to Railway

```bash
railway link
railway up
```

### Deploy to Render

1. Connect GitHub repo to [Render](https://render.com)
2. Create Web Service
3. Set environment variables
4. Deploy

### Deploy to EC2/Self-hosted

```bash
# Install dependencies
pip install -r requirements.txt

# Run with gunicorn (production)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

## 📝 Notes

- Never commit `.env` (it's in `.gitignore`)
- Always use `SUPABASE_SECRET_KEY` for backend operations
- Never expose secret key to the frontend
- Enable Row Level Security (RLS) on Supabase tables with appropriate policies
- Test AI predictions before deploying to production
