"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

// Test user ID - replace with your actual UUID from resume upload
const TEST_USER_ID = "a610985a-fe96-479b-9bdf-75b71aa5aea1";

// Types
interface Job {
  id: string;
  title: string;
  company_id: string;
  companies?: {
    name: string;
  };
}

interface MatchResult {
  status: string;
  match_score: number;
  analysis: string;
  details: {
    user_name: string;
    job_title: string;
    company_name: string;
    min_score_required: number;
    meets_threshold: boolean;
    recommendation: string;
  };
}

export default function JobMatchingPage() {
  const supabase = createClient();

  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(true);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string>("");

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setFetchingJobs(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("jobs")
        .select("*, companies(name)")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setJobs((data as Job[]) || []);
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load jobs. Please refresh the page.");
    } finally {
      setFetchingJobs(false);
    }
  };

  const handleAnalyzeFit = async () => {
    if (!selectedJobId) {
      setError("Please select a job role first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMatchResult(null);

      const response = await fetch("http://localhost:8000/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: TEST_USER_ID,
          job_id: selectedJobId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to analyze fit");
      }

      const data: MatchResult = await response.json();
      setMatchResult(data);
    } catch (err: any) {
      console.error("Error analyzing fit:", err);
      setError(err.message || "Failed to analyze job fit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 70) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreMessage = (score: number) => {
    if (score > 70) return "High Match! You should apply.";
    if (score >= 40) return "Moderate Match. Brush up on your skills.";
    return "Low Match. Consider other roles.";
  };

  const getScoreIcon = (score: number) => {
    if (score > 70) return "✅";
    if (score >= 40) return "⚠️";
    return "❌";
  };

  if (fetchingJobs) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600">Loading available jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Check Your Job Eligibility
          </h1>
          <p className="text-gray-600">
            See how well your resume matches with available job roles using
            AI-powered analysis
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Job Selection */}
          <div className="mb-6">
            <label
              htmlFor="job-select"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Select Job Role
            </label>
            <select
              id="job-select"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={loading}
            >
              <option value="">-- Choose a job role --</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.companies?.name || "Unknown Company"} - {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAnalyzeFit}
            disabled={loading || !selectedJobId}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                AI is comparing your resume...
              </span>
            ) : (
              "Analyze Fit"
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {matchResult && (
          <div className="space-y-6 animate-fade-in">
            {/* Score Card */}
            <div
              className={`rounded-2xl shadow-xl p-8 border-2 ${getScoreColor(matchResult.match_score)}`}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {getScoreIcon(matchResult.match_score)}
                </div>
                <div className="text-5xl font-bold mb-2">
                  {matchResult.match_score}%
                </div>
                <div className="text-xl font-semibold mb-4">
                  {getScoreMessage(matchResult.match_score)}
                </div>
                <div className="h-px bg-current opacity-20 my-6"></div>
                <p className="text-sm font-medium opacity-75">
                  Match Score for {matchResult.details.job_title} at{" "}
                  {matchResult.details.company_name}
                </p>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                AI Analysis
              </h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                {matchResult.analysis}
              </p>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Match Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                    <div>
                      <p className="text-sm text-gray-500">Candidate</p>
                      <p className="font-semibold text-gray-900">
                        {matchResult.details.user_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Minimum Score Required
                      </p>
                      <p className="font-semibold text-gray-900">
                        {matchResult.details.min_score_required}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                    <div>
                      <p className="text-sm text-gray-500">Meets Threshold</p>
                      <p className="font-semibold text-gray-900">
                        {matchResult.details.meets_threshold
                          ? "Yes ✅"
                          : "No ❌"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                    <div>
                      <p className="text-sm text-gray-500">Recommendation</p>
                      <p className="font-semibold text-gray-900">
                        {matchResult.details.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setMatchResult(null);
                  setSelectedJobId("");
                }}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-all"
              >
                Check Another Job
              </button>
              {matchResult.details.meets_threshold && (
                <button
                  onClick={() => {
                    alert("Application feature coming soon!");
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info Card */}
        {!matchResult && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start">
              <div className="shrink-0 text-2xl mr-4">💡</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  How it works
                </h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• AI analyzes your resume against job requirements</li>
                  <li>
                    • Uses semantic matching to understand skills and experience
                  </li>
                  <li>
                    • Provides personalized recommendations based on match score
                  </li>
                  <li>
                    • Helps you focus on roles where you&apos;re most likely to
                    succeed
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
