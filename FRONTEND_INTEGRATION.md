# Frontend Integration Guide - Robust Job Creation

## Summary

The backend has been updated with robust text sanitization. **No frontend changes are required!** Your existing code will work perfectly.

## What Was Fixed

✅ Backend now handles newlines, tabs, and control characters automatically  
✅ `company_id` can be sent as string (from `<select>` element)  
✅ Better error messages if validation fails  
✅ Detailed backend logging for debugging

## Current Frontend Code (No Changes Needed!)

```typescript
// web-client/app/admin/companies/page.tsx

const handleCreateJob = async (e: React.FormEvent) => {
  e.preventDefault();

  // This works perfectly now - no sanitization needed!
  const jobData = {
    company_id: selectedCompanyId, // String from <select>
    title: jobTitle, // Can have any characters
    description: jobDescription, // Can have newlines, tabs, etc.
    min_score: minScore, // Already a number
  };

  const response = await fetch("http://localhost:8000/jobs/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jobData),
  });

  // Backend returns clear error messages now
  if (!response.ok) {
    const error = await response.json();
    console.error("Backend error:", error.detail);
    return;
  }

  const result = await response.json();
  console.log("Job created:", result);
};
```

## What Happens Behind the Scenes

### Before (Your textarea input):

```
"Looking for:
- 5+ years experience
- Python	expertise
- Team player"
```

### After (Backend sanitizes automatically):

```
"Looking for: - 5+ years experience - Python expertise - Team player"
```

The backend uses Pydantic validators to:

1. Replace `\n`, `\r`, `\t` with spaces
2. Remove invisible control characters (`\x00-\x1f`)
3. Collapse multiple spaces
4. Validate minimum length (20 chars)

## Error Handling (Improved!)

### Validation Errors (422)

If the user enters invalid data, you'll get clear error messages:

```typescript
// Example validation error response
{
  "detail": [
    {
      "loc": ["body", "description"],
      "msg": "Description must be at least 20 characters after sanitization. Got 5 characters.",
      "type": "value_error"
    }
  ]
}
```

### Display to Users

```typescript
if (!response.ok) {
  const error = await response.json();

  if (response.status === 422 && Array.isArray(error.detail)) {
    // Pydantic validation errors
    const messages = error.detail.map(
      (e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`,
    );
    alert(`Validation errors:\n${messages.join("\n")}`);
  } else {
    // Other errors (404, 500, etc.)
    alert(`Error: ${error.detail || "Unknown error"}`);
  }
}
```

## Optional: Client-Side Preview

If you want to show users how their text will be sanitized (optional):

```typescript
const [sanitizedPreview, setSanitizedPreview] = useState('');

// Sanitize client-side (matches backend logic)
const sanitizeText = (text: string): string => {
  let clean = text.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, ' ');
  clean = clean.replace(/[\x00-\x1f]/g, '');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
};

// Show preview as user types
const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  setJobDescription(value);
  setSanitizedPreview(sanitizeText(value));
};

// In your JSX:
<textarea
  value={jobDescription}
  onChange={handleDescriptionChange}
  placeholder="Job description..."
  className="w-full p-3 border rounded-lg min-h-40"
/>

{sanitizedPreview && (
  <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
    <strong>Preview (how it will be saved):</strong>
    <p className="mt-1 text-gray-700">{sanitizedPreview}</p>
  </div>
)}
```

## Testing Checklist

Test these scenarios to verify everything works:

- [ ] Normal text (no special characters)
- [ ] Text with newlines (press Enter in textarea)
- [ ] Text with tabs (paste from Word/Excel)
- [ ] Copy-paste from websites (may have hidden characters)
- [ ] Very long job descriptions (500+ words)
- [ ] Empty description (should show validation error)
- [ ] Very short description (<20 chars after cleanup)

## Backend Logs

When debugging, check the FastAPI terminal. You'll see:

```
============================================================
[JOB CREATE] Starting job creation process
  - Company ID: 550e8400-e29b-41d4-a716-446655440000
  - Title: Senior Python Developer
  - Description length: 156 chars
  - Min Score: 70
============================================================

[STEP 1] Validating company ID...
[SUCCESS] Company validated: TechCorp Inc

[STEP 2] Generating AI embedding...
[SUCCESS] Embedding generated: 384 dimensions

[STEP 3] Inserting job into database...
[SUCCESS] Job created with ID: 660e8400-e29b-41d4-a716-446655440001
```

If there's an error, you'll see exactly where it failed.

## Common Issues & Solutions

### Issue: "Description must be at least 20 characters"

**Cause:** User entered only whitespace or special characters  
**Solution:** Show error message asking for actual content

### Issue: "Company with id XXX not found"

**Cause:** Invalid company selected or company was deleted  
**Solution:** Refresh company list or ask user to select again

### Issue: Backend returns 500 error

**Cause:** Unexpected error (database down, embedding model failed, etc.)  
**Solution:** Check backend terminal logs - detailed error info will be there

## Need Help?

1. **Backend logs**: Check FastAPI terminal for detailed error traces
2. **Frontend console**: `console.log()` the response from the API
3. **Test script**: Run `python test_job_creation.py` in ai-engine folder
4. **Documentation**: See `ROBUSTNESS_FIXES.md` for technical details

---

**Key Takeaway:** Your frontend code works as-is! The backend now handles all edge cases automatically. 🎉
