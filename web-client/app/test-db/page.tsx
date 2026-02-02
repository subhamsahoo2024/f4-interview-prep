import { createClient } from "@/utils/supabase/server";

export default async function TestDBPage() {
  const supabase = await createClient();

  const { data: companies, error } = await supabase
    .from("companies")
    .select("*");

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>

      {companies && companies.length > 0 ? (
        <div>
          <p className="text-green-600 mb-4">✓ Connected successfully!</p>
          <h2 className="text-xl font-semibold mb-2">Companies:</h2>
          <ul className="list-disc pl-6">
            {companies.map((company: any) => (
              <li key={company.id}>{company.name}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-yellow-600">Connected but no data found</p>
      )}
    </div>
  );
}
