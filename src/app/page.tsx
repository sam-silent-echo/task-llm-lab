"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

async function runExperiment(input: any) {
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed");
  return json;
}

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [temps, setTemps] = useState("0.2,0.5,0.9");
  const [tops, setTops] = useState("0.7,0.9,1.0");
  const [maxToks, setMaxToks] = useState("300");
  const [desired, setDesired] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [experimentId, setExperimentId] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResults(null);
    setExperimentId(null);
    try {
      const grid = {
        temperature: temps.split(",").map((v) => parseFloat(v.trim())).filter((n) => !Number.isNaN(n)),
        top_p: tops.split(",").map((v) => parseFloat(v.trim())).filter((n) => !Number.isNaN(n)),
        max_tokens: maxToks.split(",").map((v) => parseInt(v.trim(), 10)).filter((n) => !Number.isNaN(n)),
        model,
        desiredLength: desired as any,
      };
      const data = await runExperiment({ prompt, grid, name: "LLM Lab" });
      setResults(data);
      setExperimentId(data?.experimentId || null);
      toast.success("Experiment created", { description: "Open the experiment to compare results" });
    } catch (err: any) {
      setError(err?.message || String(err));
      toast.error("Run failed", { description: String(err?.message || err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">LLM Lab</h1>
        <Link className="text-sm text-blue-600 hover:underline" href="/experiments">View Experiments</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <form onSubmit={onSubmit}>
            <CardHeader>
              <CardTitle>Run an Experiment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Prompt</label>
                <Textarea className="mt-1" value={prompt} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)} placeholder="Describe what you want the model to do..." required/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Model</label>
                  <Input className="mt-1" value={model} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModel(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Desired length</label>
                  <Select value={desired} onValueChange={setDesired}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select length" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">short</SelectItem>
                      <SelectItem value="medium">medium</SelectItem>
                      <SelectItem value="long">long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">Temperature list</label>
                  <Input className="mt-1" value={temps} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemps(e.target.value)} placeholder="e.g. 0.2,0.5,0.9" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Top_p list</label>
                  <Input className="mt-1" value={tops} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTops(e.target.value)} placeholder="e.g. 0.7,0.9,1.0" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Max tokens list</label>
                  <Input className="mt-1" value={maxToks} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxToks(e.target.value)} placeholder="e.g. 200,300" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-xs text-slate-500">We cap the grid size for safety. Use 2–3 values per parameter.</div>
              <Button type="submit" disabled={loading}>
                {loading ? "Running..." : "Run grid"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li><span className="font-medium">Temperature</span> controls randomness (higher = more creative).</li>
              <li><span className="font-medium">Top_p</span> limits nucleus sampling (lower = safer).</li>
              <li>Use 2–3 values per parameter to visualize trends.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 text-sm rounded-md p-3">{error}</div>
      )}

      {experimentId && (
        <Card className="border-green-200">
          <CardContent className="p-4 text-sm text-green-800">
            Experiment created.
            <Link className="ml-2 underline" href={`/experiments/${experimentId}`}>View details</Link>
          </CardContent>
        </Card>
      )}

      {results && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Results</h2>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 border">Temp</th>
                    <th className="p-2 border">Top_p</th>
                    <th className="p-2 border">MaxTok</th>
                    <th className="p-2 border">Composite</th>
                    <th className="p-2 border">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((r: any, idx: number) => (
                    <tr key={idx} className="odd:bg-white even:bg-gray-50 align-top">
                      <td className="p-2 border">{r.temperature}</td>
                      <td className="p-2 border">{r.top_p}</td>
                      <td className="p-2 border">{r.max_tokens}</td>
                      <td className="p-2 border">{r.metrics ? r.metrics.composite.toFixed(3) : "-"}</td>
                      <td className="p-2 border">{r.latencyMs ? `${r.latencyMs} ms` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.results.map((r: any, idx: number) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="text-xs text-gray-600">T={r.temperature}, p={r.top_p}, max={r.max_tokens}</div>
                  {r.error ? (
                    <div className="text-red-600 text-sm mt-2">{r.error}</div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm mt-2">{r.text}</pre>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
