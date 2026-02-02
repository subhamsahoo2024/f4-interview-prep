# Smart Placement Assistant

An intelligent placement prediction and matching system that uses AI/ML to recommend the best company placements for students. Built with Next.js frontend, FastAPI backend, and Supabase for data management.

## 🎯 Overview

Smart Placement Assistant helps educational institutions and students:

- **Predict** placement probability based on student profile and company requirements
- **Analyze** resumes and identify skill gaps
- **Match** students with suitable companies using intelligent algorithms
- **Track** placement status and outcomes in real-time

## 📦 Project Structure

```
smart-placement-assistant/
├── web-client/                 # Next.js 16 Frontend
│   ├── app/                    # Next.js App Router
│   ├── utils/supabase/         # Supabase client utilities
│   ├── package.json
│   └── README.md               # Frontend setup guide
│
├── ai-engine/                  # FastAPI Backend
│   ├── main.py                 # FastAPI application
│   ├── routes/                 # API endpoints
│   ├── services/               # Business logic
│   ├── pyproject.toml
│   └── README.md               # Backend setup guide
│
├── supabase_schema.sql         # Database schema
└── README.md                   # This file
```

## 🚀 Quick Start

### Option 1: Start Both Services (Recommended)

**Terminal 1 - Start AI Engine (FastAPI):**

```bash
cd ai-engine
uv run main.py
# Server runs on http://localhost:8000
```

**Terminal 2 - Start Web Client (Next.js):**

```bash
cd web-client
npm run dev
# Server runs on http://localhost:3000
```

### Option 2: Start Individually

**Frontend Only:**

```bash
cd web-client
npm install
npm run dev
# Visit http://localhost:3000
```

**Backend Only:**

```bash
cd ai-engine
uv sync
uv run main.py
# API available at http://localhost:8000/docs
```

## 📋 Setup Instructions

### Prerequisites

- **Node.js** 18+ (for web-client)
- **Python** 3.9+ (for ai-engine)
- **Supabase Account** with project created
- **Git** for version control

### Step 1: Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema:
   - Go to SQL Editor in Supabase Dashboard
   - Copy contents of `supabase_schema.sql`
   - Run the queries to create tables

3. Get your API credentials:
   - Project URL: `Settings > API > Project URL`
   - Publishable Key: `Settings > API > Publishable Key (sb_pb_...)`
   - Secret Key: `Settings > API > Secret Key (sb_secret_...)`

### Step 2: Setup Web Client

See [web-client/README.md](web-client/README.md) for detailed frontend setup.

```bash
cd web-client
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-sbp-key
SUPABASE_SECRET_KEY=your-secret-key
```

```bash
npm run dev
```

### Step 3: Setup AI Engine

See [ai-engine/README.md](ai-engine/README.md) for detailed backend setup.

```bash
cd ai-engine
pip install -r requirements.txt
```

Create `.env`:

```env
SUPABASE_URL=your-project-url
SUPABASE_SECRET_KEY=your-secret-key
API_PORT=8000
DEBUG=False
```

```bash
python main.py
```

## 🔗 Architecture & Integration

### Frontend ↔ Backend Communication

```
Web Client (Next.js)              AI Engine (FastAPI)
    ↓                                  ↓
[Browser Client]          →    [FastAPI Server]
    ↓                                  ↓
  Supabase                         Supabase
(Publishable Key)              (Secret Key - RLS Bypass)
```

### Data Flow

1. **User Interaction** (Web Client)
   - Student logs in via Supabase Auth
   - Views profile and company matches
   - Browser client respects RLS policies

2. **API Request** (Web Client → AI Engine)
   - Calls FastAPI endpoint with student data
   - Example: `POST /api/placements/predict`
   - Includes Supabase auth token

3. **Processing** (AI Engine)
   - Fetches data from Supabase (bypasses RLS via secret key)
   - Runs ML models for prediction/matching
   - Returns results to frontend

4. **Database Update** (AI Engine → Supabase)
   - Saves predictions/analysis results
   - Updates placement status
   - Respects data ownership via RLS (when configured)

### API Endpoints

**Placements:**

- `POST /api/placements/predict` - Predict placement probability
- `GET /api/placements/{student_id}` - Get student placements

**Analysis:**

- `POST /api/analysis/resume` - Analyze resume
- `GET /api/analysis/{student_id}` - Get analysis results

**Matching:**

- `POST /api/matching/recommend` - Get company recommendations
- `GET /api/matching/compatibility/{student_id}/{company_id}` - Get score

See AI Engine documentation for detailed endpoint specs.

## 🔐 Security Architecture

### Client-Side (Browser)

- **Uses:** Supabase Publishable Key
- **Scope:** Public read-only operations
- **Security:** Row Level Security (RLS) enforced
- **Safe:** Can be exposed to frontend

### Server-Side (Next.js)

- **Uses:** Supabase Publishable Key (for regular operations)
- **Scope:** Server-only operations respecting RLS
- **Security:** RLS policies enforced
- **Use Case:** Form submissions, protected queries

### Admin-Side (FastAPI)

- **Uses:** Supabase Secret Key
- **Scope:** Full database access, RLS bypass
- **Security:** Backend-only, never exposed
- **Use Case:** Bulk operations, admin actions, ML processing

### Environment Variables

```
❌ Never commit .env or .env.local
❌ Never expose SUPABASE_SECRET_KEY to frontend
✅ Always use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in browser
✅ Enable Row Level Security on production tables
```

## 🧪 Testing

### Test Database Connection

Visit `http://localhost:3000/test-db` to verify Supabase connectivity.

### Test API Endpoints

Visit `http://localhost:8000/docs` (Swagger UI) to test FastAPI endpoints.

### Run Tests

```bash
# Backend tests
cd ai-engine
pytest

# Frontend tests
cd web-client
npm test
```

## 📚 Database Schema

The system uses these main tables:

### Companies

```sql
CREATE TABLE companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  requirements JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Students

```sql
CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  skills JSONB,
  experience JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Placements

```sql
CREATE TABLE placements (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES students(id),
  company_id BIGINT REFERENCES companies(id),
  status TEXT,
  prediction_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

See `supabase_schema.sql` for complete schema.

## 🚀 Deployment

### Web Client (Next.js)

Best platform: **Vercel** (made by Next.js creators)

```bash
# Push to GitHub, connect to Vercel
# Add environment variables in Vercel dashboard
# Auto-deploys on push
```

### AI Engine (FastAPI)

Recommended platforms:

- **Railway** - Simple deployment
- **Render** - Free tier available
- **Fly.io** - Global deployment
- **AWS/EC2** - Full control

### Database (Supabase)

- Managed by Supabase (no deployment needed)
- PostgreSQL with built-in RLS
- Real-time subscriptions supported

## 📖 Documentation

- [Frontend Setup](web-client/README.md) - Next.js 16, Supabase SSR
- [Backend Setup](ai-engine/README.md) - FastAPI, Python ML
- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Supabase Docs](https://supabase.com/docs)

## 🐛 Troubleshooting

### "Cannot find module '@supabase/ssr'"

```bash
cd web-client
npm install @supabase/supabase-js @supabase/ssr
```

### "Supabase connection failed"

1. Check `.env.local` (frontend) and `.env` (backend) values
2. Visit `http://localhost:3000/test-db` to debug
3. Verify Supabase API keys in dashboard

### "AI Engine returns 500 error"

1. Check backend console for error logs
2. Verify Supabase secret key is correct
3. Check database connection: `http://localhost:8000/docs`

### "Port already in use"

```bash
# Change Next.js port
npm run dev -- -p 3001

# Change FastAPI port
API_PORT=8001 python main.py
```

## 📝 Development Workflow

1. **Create a branch:**

   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes** in either `web-client/` or `ai-engine/`

3. **Test locally** with both services running

4. **Commit with clear messages:**

   ```bash
   git commit -m "feat: add placement prediction endpoint"
   ```

5. **Push and create pull request:**
   ```bash
   git push origin feature/your-feature
   ```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📞 Support

For issues and questions:

1. Check troubleshooting section above
2. Review component READMEs
3. Check Supabase/Next.js/FastAPI documentation
4. Open an issue on GitHub

## 🎉 Getting Help

- **Supabase Issues?** → Check [supabase.com/docs](https://supabase.com/docs)
- **Next.js Issues?** → Check [nextjs.org/docs](https://nextjs.org/docs)
- **FastAPI Issues?** → Check [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **General Questions?** → Open an issue or discussion

---

**Happy Coding!** 🚀
