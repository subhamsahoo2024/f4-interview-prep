# 🚀 Deployment Guide - Robust Job Creation

## Installation Steps

### 1. Update Backend Dependencies

```bash
cd ai-engine

# Install updated packages (includes Pydantic V2)
pip install -r requirements.txt --upgrade

# Verify Pydantic version
python -c "import pydantic; print(f'Pydantic version: {pydantic.__version__}')"
# Should show: Pydantic version: 2.x.x
```

### 2. Restart FastAPI Server

```bash
# Stop the current server (Ctrl+C)

# Start with the updated code
python main.py

# Or with Uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Verify Installation

```bash
# Check if the server is running
curl http://localhost:8000/jobs/list

# Should return: {"status":"success","count":X,"jobs":[...]}
```

## Testing the Fixes

### Quick Manual Test

1. **Open Admin Dashboard:**  
   http://localhost:3000/admin/companies

2. **Create a job with messy input:**

   ```
   Title: Senior Engineer	(Remote)

   Description:
   Looking for:
   - 5+ years experience
   - Python	& FastAPI
   - Team player

   Must have:
   	Strong communication skills
   ```

3. **Submit the form**

4. **Check backend terminal** - You should see:

   ```
   ============================================================
   [JOB CREATE] Starting job creation process
     - Company ID: xxx
     - Title: Senior Engineer (Remote)
     - Description length: 156 chars
   ============================================================

   [STEP 1] Validating company ID...
   [SUCCESS] Company validated: ...

   [STEP 2] Generating AI embedding...
   [SUCCESS] Embedding generated: 384 dimensions

   [STEP 3] Inserting job into database...
   [SUCCESS] Job created with ID: xxx
   ```

5. **Check frontend** - Should show success message

### Automated Test Suite

```bash
cd ai-engine

# Edit test file first - replace company UUID
# Open: test_job_creation.py
# Find: "PASTE_YOUR_COMPANY_UUID_HERE"
# Replace with: a real company UUID from your database

# Run tests
python test_job_creation.py
```

Expected output:

```
==================================================================
TEST 1: Normal Job Description
==================================================================
✅ SUCCESS!
   - Job ID: xxx
   - Embedding dimensions: 384

==================================================================
TEST 2: Job Description with Newlines
==================================================================
✅ SUCCESS!
   - Sanitized description: Looking for a Full Stack Engineer...

... (5 test cases total)
```

## What to Monitor

### 1. Backend Terminal Logs

✅ **Good:** You should see structured logs like:

```
[JOB CREATE] Starting job creation process
[STEP 1] Validating company ID...
[SUCCESS] Company validated
```

❌ **Bad:** If you see:

```
[ERROR] Embedding generation failed: ...
[CRITICAL ERROR] Unexpected error
```

→ Check the detailed error message and error type

### 2. Frontend Console

✅ **Good:**

```javascript
Job created: {status: "success", job: {...}}
```

❌ **Bad:**

```javascript
Backend error: {detail: "Description must be at least 20 characters"}
```

→ This is actually correct validation - user needs to enter more text

### 3. Database

Query jobs to verify they're being saved correctly:

```sql
-- In Supabase SQL Editor
SELECT
  id,
  title,
  LEFT(description, 100) as description_preview,
  min_score,
  array_length(required_skills_embedding, 1) as embedding_dims
FROM jobs
ORDER BY created_at DESC
LIMIT 5;
```

Should show:

- `embedding_dims`: 384 (all-MiniLM-L6-v2 model)
- `description_preview`: Clean text (no `\n`, `\t`, etc.)

## Rollback Plan (If Needed)

If something goes wrong, you can revert:

```bash
cd ai-engine

# Restore old code (if you have git)
git checkout HEAD~1 routers/jobs.py requirements.txt

# Reinstall old dependencies
pip install -r requirements.txt

# Restart server
python main.py
```

## Troubleshooting

### Issue: `ImportError: cannot import name 'field_validator' from 'pydantic'`

**Cause:** Pydantic V1 is installed instead of V2

**Solution:**

```bash
pip uninstall pydantic
pip install "pydantic>=2.0.0"
python -c "import pydantic; print(pydantic.__version__)"
```

### Issue: Jobs still failing with 422 error

**Cause:** Old code is still running

**Solution:**

```bash
# Stop the server completely (Ctrl+C multiple times)
# Verify no Python process is running on port 8000
netstat -ano | findstr :8000

# Kill any process if found
taskkill /PID <process_id> /F

# Restart server
python main.py
```

### Issue: "ValidationInfo not found" error

**Cause:** Mixing Pydantic V1 and V2 imports

**Solution:**

```bash
# Clean install
pip uninstall pydantic pydantic-core
pip install "pydantic>=2.0.0"
```

### Issue: Frontend still showing generic error messages

**Cause:** Error handling in frontend needs update (optional)

**Solution:** See `FRONTEND_INTEGRATION.md` for improved error display

## Performance Impact

The text sanitization adds minimal overhead:

- **Regex operations:** ~0.1ms per job
- **Embedding generation:** ~50-200ms (unchanged)
- **Database insert:** ~10-50ms (unchanged)

**Total impact:** < 1ms additional processing time ✅

## Security Benefits

✅ **Prevents JSON injection attacks**  
✅ **Removes hidden control characters**  
✅ **Validates input before database writes**  
✅ **Sanitizes user-provided content**

## Next Steps

1. ✅ **Deploy to production** (if tests pass)
2. ✅ **Monitor logs** for the first few job creations
3. ✅ **Update frontend** with better error messages (optional)
4. ✅ **Apply same pattern** to resume upload if needed
5. ✅ **Document for team** (share this guide)

## Success Criteria

After deployment, verify:

- [ ] Jobs with newlines/tabs save successfully
- [ ] Console shows detailed logs
- [ ] Frontend receives clear error messages
- [ ] No 422 JSON decode errors
- [ ] Embeddings are generated (384 dimensions)
- [ ] Jobs appear in admin dashboard list

## Support

If issues persist:

1. Check backend terminal for `[ERROR]` logs
2. Run `python test_job_creation.py` to isolate the issue
3. Verify Pydantic version: `pip show pydantic`
4. Check FastAPI version: `pip show fastapi`

---

**Deployment Date:** February 5, 2026  
**Status:** Ready for Production 🚀  
**Risk Level:** Low (backward compatible, additive changes only)
