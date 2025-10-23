import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { computeMetrics } from "@/lib/metrics";
import { callOpenAI } from "@/lib/llm";
import type { ParamGrid } from "@/types";

export const runtime = "nodejs";

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>((acc, curr) => {
    const out: T[][] = [];
    acc.forEach((a) => curr.forEach((b) => out.push([...a, b])));
    return out;
  }, [[]]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, grid, name } = body as {
      prompt: string;
      grid: ParamGrid;
      name?: string;
    };
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }
    if (!grid || !Array.isArray(grid.temperature) || !Array.isArray(grid.top_p) || !Array.isArray(grid.max_tokens)) {
      return NextResponse.json({ error: "Invalid grid: arrays required for temperature, top_p, max_tokens" }, { status: 400 });
    }
    // Basic numeric validation and bounds
    const temps = grid.temperature.map(Number).filter((n) => Number.isFinite(n) && n >= 0 && n <= 2);
    const tops = grid.top_p.map(Number).filter((n) => Number.isFinite(n) && n > 0 && n <= 1);
    const maxT = grid.max_tokens.map((n: any) => Number(n)).filter((n) => Number.isInteger(n) && n > 0 && n <= 4096);
    if (temps.length === 0 || tops.length === 0 || maxT.length === 0) {
      return NextResponse.json({ error: "Grid values out of bounds or empty" }, { status: 400 });
    }

    const model = grid.model || "gpt-4o-mini";

    // Cap total combinations to protect API usage
    const totalCombos = temps.length * tops.length * maxT.length;
    if (totalCombos > 30) {
      return NextResponse.json({ error: `Grid too large (${totalCombos} combos). Please reduce below 30.` }, { status: 400 });
    }

    const experiment = await prisma.experiment.create({
      data: {
        name: name || new Date().toISOString(),
        prompt,
        paramGrid: grid as unknown as any,
      },
    });

    const combos = cartesian<number>([temps, tops, maxT]);

    const results: any[] = [];

    for (const [temperature, top_p, max_tokens] of combos) {
      const run = await prisma.run.create({
        data: {
          experimentId: experiment.id,
          temperature,
          topP: top_p,
          maxTokens: max_tokens,
          provider: "openai",
        },
      });

      try {
        const { text, tokens, latencyMs } = await callOpenAI({
          prompt,
          temperature,
          top_p,
          max_tokens,
          model,
        });

        const metrics = computeMetrics({ text, prompt, desiredLength: grid.desiredLength || null });

        const resp = await prisma.response.create({
          data: {
            runId: run.id,
            text,
            tokens,
            latencyMs,
          },
        });
        await prisma.metrics.create({
          data: {
            responseId: resp.id,
            completeness: metrics.completeness,
            coherence: metrics.coherence,
            repetition: metrics.repetition,
            readability: metrics.readability,
            lengthFit: metrics.lengthFit,
            structure: metrics.structure,
            composite: metrics.composite,
          },
        });

        results.push({
          runId: run.id,
          temperature,
          top_p,
          max_tokens,
          model,
          text,
          tokens,
          latencyMs,
          metrics,
        });
      } catch (err: any) {
        results.push({
          runId: run.id,
          temperature,
          top_p,
          max_tokens,
          model,
          error: err?.message || String(err),
        });
      }
    }

    return NextResponse.json({ experimentId: experiment.id, results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
