import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <main className="flex flex-col items-center justify-center text-center px-8">
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Smart Placement Assistant
          </h1>
          <p className="text-xl text-white/90 mb-2 drop-shadow">
            AI-Powered Resume Analysis & Job Matching
          </p>
          <p className="text-white/80 max-w-2xl mx-auto drop-shadow">
            Upload your resume, let our AI analyze your skills, and get matched
            with the perfect companies for your career growth.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard/resume"
            className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold text-lg
              hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl
              hover:scale-105 transform"
          >
            Go to Dashboard →
          </Link>

          <Link
            href="/test-db"
            className="px-8 py-4 bg-white/10 text-white rounded-lg font-semibold text-lg
              hover:bg-white/20 transition-all duration-200 shadow-xl backdrop-blur-sm
              border border-white/30"
          >
            Test Database
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="text-white font-semibold text-lg mb-2">
              Upload Resume
            </h3>
            <p className="text-white/80 text-sm">
              Upload your PDF resume and let AI extract your skills
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-white font-semibold text-lg mb-2">
              AI Analysis
            </h3>
            <p className="text-white/80 text-sm">
              Advanced ML models analyze your qualifications
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-white font-semibold text-lg mb-2">
              Get Matched
            </h3>
            <p className="text-white/80 text-sm">
              Find companies that perfectly match your profile
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
