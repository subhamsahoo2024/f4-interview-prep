"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

// Types
interface Company {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  min_score: number;
  created_at: string;
}

interface JobWithCompany extends Job {
  companies: { name: string } | null;
}

// FastAPI endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminCompaniesPage() {
  const supabase = createClient();

  // State for companies and jobs data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for Create Company
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companySubmitting, setCompanySubmitting] = useState(false);
  const [companyMessage, setCompanyMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form states for Create Job
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobMinScore, setJobMinScore] = useState(50);
  const [jobSubmitting, setJobSubmitting] = useState(false);
  const [jobMessage, setJobMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch companies and jobs on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (companiesError) throw companiesError;

      // Fetch jobs with company info
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*, companies(name)")
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      // Handle null/undefined data gracefully
      setCompanies(companiesData || []);
      setJobs(jobsData || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Create Company handler
  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    setCompanySubmitting(true);
    setCompanyMessage(null);

    try {
      const { data, error } = await supabase
        .from("companies")
        .insert({ name: companyName, description: companyDescription || null })
        .select()
        .single();

      if (error) throw error;

      setCompanyMessage({ type: "success", text: `Company "${data.name}" created successfully!` });
      setCompanyName("");
      setCompanyDescription("");
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create company";
      setCompanyMessage({ type: "error", text: errorMessage });
    } finally {
      setCompanySubmitting(false);
    }
  }

  // Create Job handler (calls FastAPI for embedding generation)
  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    setJobSubmitting(true);
    setJobMessage(null);

    try {
      const response = await fetch(`${API_URL}/jobs/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: selectedCompanyId,
          title: jobTitle,
          description: jobDescription,
          min_score: jobMinScore,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create job");
      }

      setJobMessage({
        type: "success",
        text: `Job "${data.job.title}" created with ${data.job.embedding_dimensions}-dim embedding!`,
      });
      setJobTitle("");
      setJobDescription("");
      setSelectedCompanyId("");
      setJobMinScore(50);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create job";
      setJobMessage({ type: "error", text: errorMessage });
    } finally {
      setJobSubmitting(false);
    }
  }

  // Group jobs by company
  const jobsByCompany = (companies || []).reduce(
    (acc, company) => {
      acc[company.id] = (jobs || []).filter((job) => job.company_id === company.id);
      return acc;
    },
    {} as Record<string, JobWithCompany[]>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-purple-200">
            Manage companies and job postings with AI-powered skill matching
          </p>
        </div>

        {/* Forms Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Create Company Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-sm">
                🏢
              </span>
              Create Company
            </h2>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="e.g., TechCorp Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  Description
                </label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                  placeholder="Brief description of the company..."
                />
              </div>

              <button
                type="submit"
                disabled={companySubmitting || !companyName}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/25"
              >
                {companySubmitting ? "Creating..." : "Create Company"}
              </button>

              {companyMessage && (
                <div
                  className={`p-3 rounded-lg text-sm ${companyMessage.type === "success"
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                >
                  {companyMessage.text}
                </div>
              )}
            </form>
          </div>

          {/* Create Job Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm">
                💼
              </span>
              Create Job
            </h2>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  Company *
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                >
                  <option value="" className="bg-slate-800">
                    Select a company...
                  </option>
                  {(companies || []).map((company) => (
                    <option key={company.id} value={company.id} className="bg-slate-800">
                      {company.name}
                    </option>
                  ))}
                </select>
                {companies.length === 0 && !loading && (
                  <p className="text-yellow-400 text-xs mt-1">
                    Create a company first to add jobs.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="e.g., Senior Python Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  Description * (min 20 chars)
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                  minLength={20}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                  placeholder="Describe the role, required skills, and responsibilities..."
                />
                <p className="text-xs text-purple-300 mt-1">
                  {jobDescription.length}/20 characters (used for AI embedding)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">
                  Minimum Score: {jobMinScore}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={jobMinScore}
                  onChange={(e) => setJobMinScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-purple-300 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  jobSubmitting ||
                  !selectedCompanyId ||
                  !jobTitle ||
                  jobDescription.length < 20
                }
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/25"
              >
                {jobSubmitting ? "Creating with AI Embedding..." : "Create Job"}
              </button>

              {jobMessage && (
                <div
                  className={`p-3 rounded-lg text-sm ${jobMessage.type === "success"
                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                >
                  {jobMessage.text}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Companies & Jobs List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-sm">
                📋
              </span>
              Companies & Jobs
            </h2>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center gap-2"
            >
              {loading ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <>
                  <span>↻</span> Refresh
                </>
              )}
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin text-4xl mb-4">⟳</div>
              <p className="text-purple-200">Loading data...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && (companies || []).length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-medium text-white mb-2">
                No companies found
              </h3>
              <p className="text-purple-200">
                Create one above to get started.
              </p>
            </div>
          )}

          {/* Companies List */}
          {!loading && !error && (companies || []).length > 0 && (
            <div className="space-y-4">
              {(companies || []).map((company) => (
                <div
                  key={company.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {company.name}
                      </h3>
                      {company.description && (
                        <p className="text-purple-200 text-sm mt-1">
                          {company.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
                      {(jobsByCompany[company.id] || []).length} jobs
                    </span>
                  </div>

                  {/* Jobs under this company */}
                  {(jobsByCompany[company.id] || []).length > 0 ? (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <p className="text-xs font-medium text-purple-300 uppercase tracking-wider mb-3">
                        Active Jobs
                      </p>
                      <div className="grid gap-2">
                        {(jobsByCompany[company.id] || []).map((job) => (
                          <div
                            key={job.id}
                            className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-lg"
                          >
                            <div>
                              <p className="text-white font-medium">
                                {job.title}
                              </p>
                              <p className="text-purple-300 text-xs truncate max-w-md">
                                {job.description.substring(0, 80)}...
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                                Min: {job.min_score}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-purple-300/60 text-sm italic mt-2">
                      No jobs posted yet
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-purple-300/60 text-sm">
          <p>
            Jobs are created via FastAPI to generate AI embeddings for skill matching.
          </p>
        </div>
      </div>
    </div>
  );
}
