import { createClient } from "@/utils/supabase/server";

export default async function TestDBPage() {
  const supabase = await createClient();

  // Test companies table
  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("*");

  // Test profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          Database Connection Test
        </h1>

        {/* Companies Table Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Companies Table
          </h2>

          {companiesError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">
                <strong>Error:</strong> {companiesError.message}
              </p>
            </div>
          ) : companies && companies.length > 0 ? (
            <div>
              <p className="text-green-600 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Connected successfully! Found {companies.length} companies.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                {companies.map((company: any) => (
                  <li key={company.id} className="text-gray-700">
                    {company.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700">
                Database is connected, but the 'companies' table has no entries.
              </p>
            </div>
          )}
        </div>

        {/* Profiles Table Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Profiles Table
          </h2>

          {profilesError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">
                <strong>Error:</strong> {profilesError.message}
              </p>
            </div>
          ) : profiles && profiles.length > 0 ? (
            <div>
              <p className="text-green-600 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Connected successfully! Found {profiles.length} profiles.
              </p>
              <div className="space-y-2">
                {profiles.map((profile: any) => (
                  <div
                    key={profile.id}
                    className="p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <p className="text-gray-700">
                      <strong>ID:</strong> {profile.id}
                    </p>
                    {profile.resume_url && (
                      <p className="text-gray-600 text-sm">
                        Resume: {profile.resume_url}
                      </p>
                    )}
                    {profile.skills_embedding && (
                      <p className="text-green-600 text-sm">
                        ✓ Has skills embedding
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 mb-2">
                Database is connected, but the 'profiles' table has no entries.
              </p>
              <p className="text-yellow-700 text-sm">
                Please upload a resume first at{" "}
                <a
                  href="/dashboard/resume"
                  className="underline font-medium hover:text-yellow-900"
                >
                  /dashboard/resume
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Navigation Helper */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">
            <strong>Next Steps:</strong>
          </p>
          <ul className="mt-2 text-blue-700 text-sm space-y-1">
            <li>
              →{" "}
              <a
                href="/dashboard/resume"
                className="underline hover:text-blue-900"
              >
                Upload a resume
              </a>{" "}
              to test the profiles table
            </li>
            <li>→ Add companies to the database via Supabase dashboard</li>
            <li>
              → Check the{" "}
              <a href="/" className="underline hover:text-blue-900">
                home page
              </a>{" "}
              for more features
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
