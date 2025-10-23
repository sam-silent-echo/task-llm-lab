"use client";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ExperimentsPage() {
  const { data, error, isLoading } = useSWR("/api/experiments", fetcher);

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Experiments</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">Back to Home</Link>
      </div>
      {isLoading && <div className="text-sm text-gray-600">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load experiments</div>}
      {data && (
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 border text-left">Name</th>
              <th className="p-2 border text-left">Created</th>
              <th className="p-2 border text-left">Runs</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.experiments.map((e: any) => (
              <tr key={e.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{e.name}</td>
                <td className="p-2 border">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="p-2 border">{e._count?.runs ?? 0}</td>
                <td className="p-2 border">
                  <Link className="text-blue-600 hover:underline" href={`/experiments/${e.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
