"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function ResumeUploadPage() {
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [previewText, setPreviewText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test User ID - Replace with your actual UUID from Supabase
  const TEST_USER_ID = "a610985a-fe96-479b-9bdf-75b71aa5aea1";

  // Handle file selection
  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setErrorMessage("Please select a PDF file");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setErrorMessage("");
    setStatus("idle");
    setPreviewText("");
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please select a file first");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setPreviewText("Processing AI embeddings...");

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", TEST_USER_ID);

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

      // Display preview text
      if (data.details) {
        setPreviewText(
          `✓ Successfully processed your resume!\n\n` +
          `📄 File: ${data.details.filename}\n` +
          `📊 Extracted: ${data.details.text_length} characters\n` +
          `🤖 Generated: ${data.details.embedding_dimensions}D AI embedding vector\n` +
          `✅ Profile updated in database\n\n` +
          `Your resume is now ready for job matching!`,
        );
      }
    } catch (error: unknown) {
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "An error occurred during upload";
      setErrorMessage(errorMessage);
      setPreviewText("");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 font-medium"
        >
          ← Back to Home
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📄</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upload Your Resume
            </h1>
            <p className="text-gray-600">
              Let our AI analyze your skills and match you with top companies
            </p>
          </div>

          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 mb-6 cursor-pointer ${isDragging
                ? "border-indigo-500 bg-indigo-50"
                : file
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
              }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />

            {file ? (
              <div className="space-y-2">
                <div className="text-4xl">✅</div>
                <p className="text-lg font-semibold text-green-700">
                  {file.name}
                </p>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setStatus("idle");
                    setPreviewText("");
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-5xl">📤</div>
                <div>
                  <p className="text-lg font-semibold text-gray-700 mb-1">
                    Drag & Drop your resume here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse (PDF only)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleUpload}
            disabled={!file || status === "loading"}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${!file || status === "loading"
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg transform hover:scale-[1.02]"
              }`}
          >
            {status === "loading" ? (
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
                Uploading...
              </span>
            ) : (
              "Analyze Resume"
            )}
          </button>

          {/* Status Area */}
          <div className="mt-6 min-h-30">
            {status === "loading" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium flex items-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
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
                  {previewText || "Processing AI embeddings..."}
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <div className="flex items-start mb-3">
                  <svg
                    className="h-6 w-6 text-green-600 mr-2 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-800 mb-2">Success!</h3>
                    <pre className="text-sm text-green-700 whitespace-pre-line font-sans">
                      {previewText}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-red-600 mr-2 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && status !== "error" && (
              <div className="text-sm text-red-600 mt-2">{errorMessage}</div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-xs text-indigo-800 mb-2">
              <strong>Test User ID:</strong>{" "}
              <code className="bg-indigo-100 px-2 py-1 rounded">
                {TEST_USER_ID}
              </code>
            </p>
            <p className="text-xs text-indigo-700">
              💡 Make sure the FastAPI backend is running on{" "}
              <strong>http://localhost:8000</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
