"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResumeUploadPage() {
  const router = useRouter();

  // State management
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewText, setPreviewText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [uploadDetails, setUploadDetails] = useState<any>(null);

  // Hardcoded user_id for testing (replace with actual auth later)
  const USER_ID = "a610985a-fe96-479b-9bdf-75b71aa5aea1"; // You can get this from Supabase Auth or use a UUID

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setErrorMessage("Please select a PDF file");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMessage("");
      setStatus("idle");
      setPreviewText("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select a file first");
      return;
    }

    setStatus("uploading");
    setErrorMessage("");
    setPreviewText("");

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("user_id", USER_ID);

      // Send POST request to FastAPI backend
      const response = await fetch("http://localhost:8000/resume/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      // Success!
      setStatus("success");
      setUploadDetails(data.details);

      // Show preview of what was extracted
      if (data.details) {
        setPreviewText(
          `✓ Extracted ${data.details.text_length} characters\n` +
            `✓ Generated ${data.details.embedding_dimensions}D embedding vector\n` +
            `✓ Profile updated successfully`,
        );
      }
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "An error occurred during upload");
    }
  };

  const handleCheckCompatibility = () => {
    // Navigate to job matching page (to be implemented)
    router.push("/dashboard/matching");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Upload Your Resume
          </h1>
          <p className="text-gray-600">
            Upload your resume to get personalized job recommendations and
            placement predictions
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Resume (PDF only)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={status === "uploading"}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected:{" "}
                <span className="font-medium">{selectedFile.name}</span> (
                {(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || status === "uploading"}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-semibold
              hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed
              transition-colors duration-200"
          >
            {status === "uploading" ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing Resume...
              </span>
            ) : (
              "Upload Resume"
            )}
          </button>

          {/* Status Messages */}
          {status === "success" && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-green-800">
                    Resume Uploaded Successfully!
                  </h3>
                  {previewText && (
                    <pre className="mt-2 text-sm text-green-700 whitespace-pre-line font-mono">
                      {previewText}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-red-500 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Upload Failed
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && status !== "error" && (
            <div className="mt-4 text-sm text-red-600">{errorMessage}</div>
          )}

          {/* Check Compatibility Button (shown after success) */}
          {status === "success" && (
            <div className="mt-6">
              <button
                onClick={handleCheckCompatibility}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-semibold
                  hover:bg-green-700 transition-colors duration-200
                  flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                Check Job Compatibility
              </button>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-blue-500 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                How it works
              </h3>
              <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>Upload your PDF resume</li>
                <li>Our AI extracts text and analyzes your skills</li>
                <li>We generate a semantic embedding for matching</li>
                <li>Get personalized job recommendations</li>
              </ul>
              <p className="mt-3 text-xs text-blue-600">
                <strong>Test User ID:</strong> {USER_ID}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
