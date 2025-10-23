import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

function toCSV(rows: any[]): string {
  const headers = [
    "runId",
    "temperature",
    "top_p",
    "max_tokens",
    "model",
    "latencyMs",
    "tokens",
    "composite",
    "completeness",
    "coherence",
    "repetition",
    "readability",
    "lengthFit",
    "structure",
    "text",
  ];
  const escape = (v: any) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      escape(r.runId),
      r.temperature,
      r.top_p,
      r.max_tokens,
      escape(r.model),
      r.latencyMs,
      r.tokens,
      r.metrics?.composite ?? "",
      r.metrics?.completeness ?? "",
      r.metrics?.coherence ?? "",
      r.metrics?.repetition ?? "",
      r.metrics?.readability ?? "",
      r.metrics?.lengthFit ?? "",
      r.metrics?.structure ?? "",
      escape(r.text ?? ""),
    ].join(","));
  }
  return lines.join("\n");
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
 const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: {
      runs: {
        orderBy: { createdAt: "asc" },
        include: { response: { include: { metrics: true } } },
      },
    },
  });
  if (!experiment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = experiment.runs.map((run) => ({
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

  if (format === "csv") {
    const csv = toCSV(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=experiment_${id}.csv`,
      },
    });
  }

  return NextResponse.json({
    id: experiment.id,
    name: experiment.name,
    createdAt: experiment.createdAt,
    prompt: experiment.prompt,
    paramGrid: experiment.paramGrid,
    runs: rows,
  });
}
