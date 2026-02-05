"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

// Types
interface Company {
    id: string;
    name: string;
}

interface Job {
    id: string;
    company_id: string;
    title: string;
    min_score: number;
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

// FastAPI endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Circular Progress Component
function CircularProgress({
    percentage,
    size = 200,
    strokeWidth = 12,
}: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    // Color based on score
    const getColor = () => {
        if (percentage >= 70) return "#22c55e"; // green
        if (percentage >= 50) return "#eab308"; // yellow
        if (percentage >= 30) return "#f97316"; // orange
        return "#ef4444"; // red
    };

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: "stroke-dashoffset 1s ease-out, stroke 0.5s ease",
                    }}
                />
            </svg>
            {/* Percentage text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                    className="text-5xl font-bold text-white"
                    style={{ color: getColor() }}
                >
                    {percentage.toFixed(0)}%
                </span>
                <span className="text-sm text-purple-200 mt-1">Match Score</span>
            </div>
        </div>
    );
}

export default function MatchingPage() {
    const supabase = createClient();

    // User state - simulated for now (in real app, get from auth)
    const [userId, setUserId] = useState<string | null>(null);
    const [userReady, setUserReady] = useState(false);
    const [checkingUser, setCheckingUser] = useState(true);

    // Data state
    const [companies, setCompanies] = useState<Company[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [selectedJobId, setSelectedJobId] = useState("");

    // Match result state
    const [matching, setMatching] = useState(false);
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
    const [matchError, setMatchError] = useState<string | null>(null);

    // Fetch user status and data on mount
    useEffect(() => {
        checkUserStatus();
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Filter jobs when company changes
    const filteredJobs = selectedCompanyId
        ? (jobs || []).filter((job) => job.company_id === selectedCompanyId)
        : [];

    async function checkUserStatus() {
        setCheckingUser(true);
        try {
            // Get current logged-in user
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                setUserId(user.id);

                // Check if user has skills embedding
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("skills_embedding")
                    .eq("id", user.id)
                    .single();

                setUserReady(!!profile?.skills_embedding);
            } else {
                setUserId(null);
                setUserReady(false);
            }
        } catch (err) {
            console.error("Error checking user:", err);
            setUserReady(false);
        } finally {
            setCheckingUser(false);
        }
    }

    async function fetchData() {
        setLoading(true);
        try {
            // Fetch companies
            const { data: companiesData } = await supabase
                .from("companies")
                .select("id, name")
                .order("name");

            // Fetch jobs
            const { data: jobsData } = await supabase
                .from("jobs")
                .select("id, company_id, title, min_score")
                .eq("is_active", true)
                .order("title");

            setCompanies(companiesData || []);
            setJobs(jobsData || []);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCheckMatch() {
        if (!userId || !selectedJobId) return;

        setMatching(true);
        setMatchResult(null);
        setMatchError(null);

        try {
            const response = await fetch(`${API_URL}/match`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    job_id: selectedJobId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to calculate match");
            }

            setMatchResult(data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "An error occurred";
            setMatchError(errorMessage);
        } finally {
            setMatching(false);
        }
    }

    // Loading state
    if (checkingUser || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin text-6xl mb-4">⟳</div>
                    <p className="text-purple-200">Loading...</p>
                </div>
            </div>
        );
    }

    // Not logged in state
    if (!userId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center max-w-md">
                    <div className="text-6xl mb-4">🔐</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Login Required
                    </h2>
                    <p className="text-purple-200 mb-6">
                        Please log in to access the job matching feature.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    // Resume not uploaded state
    if (!userReady) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center max-w-md">
                    <div className="text-6xl mb-4">📄</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Resume Required
                    </h2>
                    <p className="text-purple-200 mb-6">
                        Upload your resume first to enable AI-powered job matching. We need to
                        analyze your skills to find the best matches.
                    </p>
                    <Link
                        href="/dashboard/resume"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all"
                    >
                        Upload Resume First
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">Job Matching</h1>
                    <p className="text-purple-200">
                        Discover how well your skills align with job requirements using AI
                    </p>
                </div>

                {/* Selection Form */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Company Select */}
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-2">
                                Select Company
                            </label>
                            <select
                                value={selectedCompanyId}
                                onChange={(e) => {
                                    setSelectedCompanyId(e.target.value);
                                    setSelectedJobId("");
                                    setMatchResult(null);
                                }}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="" className="bg-slate-800">
                                    Choose a company...
                                </option>
                                {(companies || []).map((company) => (
                                    <option
                                        key={company.id}
                                        value={company.id}
                                        className="bg-slate-800"
                                    >
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Job Select */}
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-2">
                                Select Job
                            </label>
                            <select
                                value={selectedJobId}
                                onChange={(e) => {
                                    setSelectedJobId(e.target.value);
                                    setMatchResult(null);
                                }}
                                disabled={!selectedCompanyId}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="" className="bg-slate-800">
                                    {selectedCompanyId
                                        ? "Choose a job..."
                                        : "Select a company first"}
                                </option>
                                {filteredJobs.map((job) => (
                                    <option key={job.id} value={job.id} className="bg-slate-800">
                                        {job.title} (Min: {job.min_score}%)
                                    </option>
                                ))}
                            </select>
                            {selectedCompanyId && filteredJobs.length === 0 && (
                                <p className="text-yellow-400 text-sm mt-2">
                                    No jobs available for this company.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Check Match Button */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={handleCheckMatch}
                            disabled={!selectedJobId || matching}
                            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/25 text-lg"
                        >
                            {matching ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin">⟳</span> Analyzing...
                                </span>
                            ) : (
                                "Check Match"
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {matchError && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-8 text-center">
                        <p className="text-red-300">{matchError}</p>
                    </div>
                )}

                {/* Match Result */}
                {matchResult && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                        <div className="text-center mb-8">
                            <CircularProgress percentage={matchResult.match_score} />
                        </div>

                        {/* Analysis */}
                        <div className="bg-white/5 rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                <span>🔍</span> Analysis
                            </h3>
                            <p className="text-purple-200 leading-relaxed">
                                {matchResult.analysis}
                            </p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-sm text-purple-300 mb-1">Job Position</p>
                                <p className="text-white font-medium">
                                    {matchResult.details.job_title}
                                </p>
                                <p className="text-purple-200 text-sm">
                                    at {matchResult.details.company_name}
                                </p>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-sm text-purple-300 mb-1">Minimum Required</p>
                                <p className="text-white font-medium">
                                    {matchResult.details.min_score_required}%
                                </p>
                                <p
                                    className={`text-sm ${matchResult.details.meets_threshold
                                        ? "text-green-400"
                                        : "text-yellow-400"
                                        }`}
                                >
                                    {matchResult.details.meets_threshold
                                        ? "✓ You meet the threshold!"
                                        : "✗ Below threshold"}
                                </p>
                            </div>
                        </div>

                        {/* Recommendation */}
                        <div
                            className={`rounded-xl p-4 ${matchResult.details.meets_threshold
                                ? "bg-green-500/20 border border-green-500/30"
                                : "bg-yellow-500/20 border border-yellow-500/30"
                                }`}
                        >
                            <p
                                className={
                                    matchResult.details.meets_threshold
                                        ? "text-green-300"
                                        : "text-yellow-300"
                                }
                            >
                                <strong>Recommendation:</strong>{" "}
                                {matchResult.details.recommendation}
                            </p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!matchResult && !matchError && companies.length === 0 && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
                        <div className="text-6xl mb-4">🏢</div>
                        <h3 className="text-xl font-medium text-white mb-2">
                            No Companies Available
                        </h3>
                        <p className="text-purple-200">
                            There are no companies with job postings yet. Check back later!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
