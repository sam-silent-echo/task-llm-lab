"use client";
import useSWR from "swr";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type RunRow = {
  runId: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  model: string;
  latencyMs: number | null;
  tokens: number | null;
  text: string | null;
  metrics: any | null;
};

export default function ExperimentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, error, isLoading } = useSWR(`/api/experiments/${id}`, fetcher);
  const [sortKey, setSortKey] = useState<keyof RunRow | "composite">("composite");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sel, setSel] = useState<string[]>([]);

  const rows: RunRow[] = useMemo(() => {
    if (!data?.experiment) return [];
    return data.experiment.runs.map((run: any) => ({
      runId: run.id,
      temperature: run.temperature,
      top_p: run.topP,
      max_tokens: run.maxTokens,
      model: "openai",
      latencyMs: run.response?.latencyMs ?? null,
      tokens: run.response?.tokens ?? null,
      text: run.response?.text ?? null,
      metrics: run.response?.metrics ?? null,
    }));
  }, [data]);

  const sorted = useMemo(() => {
    const r = [...rows];
    r.sort((a, b) => {
      const av = sortKey === "composite" ? a.metrics?.composite ?? -Infinity : (a as any)[sortKey];
      const bv = sortKey === "composite" ? b.metrics?.composite ?? -Infinity : (b as any)[sortKey];
      if (av === bv) return 0;
      return (av < bv ? -1 : 1) * (sortDir === "asc" ? 1 : -1);
    });
    return r;
  }, [rows, sortKey, sortDir]);

  const toggleSel = (id: string) => {
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 2 ? [s[1], id] : [...s, id]));
  };

  const left = sorted.find((r) => r.runId === sel[0]);
  const right = sorted.find((r) => r.runId === sel[1]);

  // Prepare data for charts
  const chartData = useMemo(() => {
    const pts = sorted
      .filter((r) => typeof r.metrics?.composite === "number")
      .map((r) => ({
        t: r.temperature,
        p: r.top_p,
        c: r.metrics!.composite as number,
      }));
    const tMin = Math.min(0, ...pts.map((d) => d.t));
    const tMax = Math.max(1, ...pts.map((d) => d.t));
    const pMin = Math.min(0, ...pts.map((d) => d.p));
    const pMax = Math.max(1, ...pts.map((d) => d.p));
    const cMin = Math.min(0, ...pts.map((d) => d.c));
    const cMax = Math.max(1, ...pts.map((d) => d.c));
    return { pts, tMin, tMax, pMin, pMax, cMin, cMax };
  }, [sorted]);

  const Chart = ({ xKey }: { xKey: "t" | "p" }) => {
    const w = 640;
    const h = 240;
    const pad = 36;
    const { pts, tMin, tMax, pMin, pMax, cMin, cMax } = chartData;
    const xMin = xKey === "t" ? tMin : pMin;
    const xMax = xKey === "t" ? tMax : pMax;
    const x = (v: number) => pad + ((v - xMin) / Math.max(1e-6, xMax - xMin)) * (w - pad * 2);
    const y = (v: number) => h - pad - ((v - cMin) / Math.max(1e-6, cMax - cMin)) * (h - pad * 2);
    const label = xKey === "t" ? "temperature" : "top_p";
    return (
      <svg width={w} height={h} className="border rounded bg-white">
        {/* axes */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#ddd" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#ddd" />
        <text x={w / 2} y={h - 8} textAnchor="middle" fontSize={12} fill="#555">{label}</text>
        <text x={12} y={h / 2} transform={`rotate(-90 12 ${h / 2})`} textAnchor="middle" fontSize={12} fill="#555">composite</text>
        {/* points */}
        {pts.map((d, i) => (
          <circle key={i} cx={x(xKey === "t" ? d.t : d.p)} cy={y(d.c)} r={4} fill="#2563eb" fillOpacity={0.8} />
        ))}
      </svg>
    );
  };

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Experiment</h1>
        <div className="flex gap-3 text-sm">
          <a className="text-blue-600 hover:underline" href={`/api/experiments/${id}/export?format=json`}>Export JSON</a>
          <a className="text-blue-600 hover:underline" href={`/api/experiments/${id}/export?format=csv`}>Export CSV</a>
          <Link className="text-blue-600 hover:underline" href="/experiments">Back to list</Link>
          <Link className="text-blue-600 hover:underline" href="/">Home</Link>
        </div>
      </div>

      {isLoading && <div className="text-sm text-gray-600">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load experiment</div>}

      {data?.experiment && (
        <>
          <div className="border rounded p-4 space-y-1">
            <div className="text-sm text-gray-600">ID: {data.experiment.id}</div>
            <div className="text-base font-medium">{data.experiment.name}</div>
            <div className="text-sm text-gray-600">Created: {new Date(data.experiment.createdAt).toLocaleString()}</div>
            <div className="mt-2">
              <div className="text-sm font-semibold mb-1">Prompt</div>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded border">{data.experiment.prompt}</pre>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Sort by:</label>
            <select className="border rounded p-1 text-sm" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
              <option value="composite">composite</option>
              <option value="temperature">temperature</option>
              <option value="top_p">top_p</option>
              <option value="max_tokens">max_tokens</option>
              <option value="latencyMs">latencyMs</option>
              <option value="tokens">tokens</option>
            </select>
            <select className="border rounded p-1 text-sm" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border">Pick</th>
                  <th className="p-2 border">Temp</th>
                  <th className="p-2 border">Top_p</th>
                  <th className="p-2 border">MaxTok</th>
                  <th className="p-2 border">Composite</th>
                  <th className="p-2 border">Latency</th>
                  <th className="p-2 border">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.runId} className="odd:bg-white even:bg-gray-50 align-top">
                    <td className="p-2 border"><input type="checkbox" checked={sel.includes(r.runId)} onChange={() => toggleSel(r.runId)} /></td>
                    <td className="p-2 border">{r.temperature}</td>
                    <td className="p-2 border">{r.top_p}</td>
                    <td className="p-2 border">{r.max_tokens}</td>
                    <td className="p-2 border">
                      {r.metrics ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-32 bg-gray-200 rounded overflow-hidden">
                            <div className="h-2 bg-blue-600" style={{ width: `${Math.round((r.metrics.composite || 0) * 100)}%` }} />
                          </div>
                          <span>{r.metrics.composite.toFixed(3)}</span>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="p-2 border">{r.latencyMs ?? "-"}</td>
                    <td className="p-2 border">{r.tokens ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Temperature vs Composite</div>
              <Chart xKey="t" />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Top_p vs Composite</div>
              <Chart xKey="p" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <div className="font-medium">Left selection</div>
              {left ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">T={left.temperature}, p={left.top_p}, max={left.max_tokens}</div>
                  {left.metrics && (
                    <div className="text-xs text-gray-700">composite: {left.metrics.composite.toFixed(3)} | completeness: {left.metrics.completeness.toFixed(2)} | coherence: {left.metrics.coherence.toFixed(2)}</div>
                  )}
                  <pre className="whitespace-pre-wrap text-sm mt-2">{left.text ?? "(no response)"}</pre>
                </div>
              ) : <div className="text-sm text-gray-500">Select a run</div>}
            </div>
            <div className="border rounded p-3">
              <div className="font-medium">Right selection</div>
              {right ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">T={right.temperature}, p={right.top_p}, max={right.max_tokens}</div>
                  {right.metrics && (
                    <div className="text-xs text-gray-700">composite: {right.metrics.composite.toFixed(3)} | completeness: {right.metrics.completeness.toFixed(2)} | coherence: {right.metrics.coherence.toFixed(2)}</div>
                  )}
                  <pre className="whitespace-pre-wrap text-sm mt-2">{right.text ?? "(no response)"}</pre>
                </div>
              ) : <div className="text-sm text-gray-500">Select a run</div>}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
