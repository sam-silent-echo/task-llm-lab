import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

// Expected JSON shape:
// {
//   name: string,
//   prompt: string,
//   paramGrid: any,
//   runs: Array<{
//     temperature: number,
//     top_p: number,
//     max_tokens: number,
//     model?: string,
//     text?: string,
//     tokens?: number,
//     latencyMs?: number,
//     metrics?: {
//       completeness: number, coherence: number, repetition: number,
//       readability: number, lengthFit: number, structure: number, composite: number
//     }
//   }>
// }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, prompt, paramGrid, runs } = body ?? {};
    if (!prompt) return NextResponse.json({ error: "Missing prompt" }, { status: 400 });

    const experiment = await prisma.experiment.create({
      data: {
        name: name || new Date().toISOString(),
        prompt,
        paramGrid: paramGrid ?? {},
      },
    });

    if (Array.isArray(runs)) {
      for (const r of runs) {
        const run = await prisma.run.create({
          data: {
            experimentId: experiment.id,
            temperature: r.temperature ?? 0,
            topP: r.top_p ?? 1,
            maxTokens: r.max_tokens ?? 256,
            provider: "openai",
          },
        });
        if (r.text != null) {
          const resp = await prisma.response.create({
            data: {
              runId: run.id,
              text: String(r.text),
              tokens: Number(r.tokens ?? 0),
              latencyMs: Number(r.latencyMs ?? 0),
            },
          });
          if (r.metrics) {
            await prisma.metrics.create({
              data: {
                responseId: resp.id,
                completeness: Number(r.metrics.completeness ?? 0),
                coherence: Number(r.metrics.coherence ?? 0),
                repetition: Number(r.metrics.repetition ?? 0),
                readability: Number(r.metrics.readability ?? 0),
                lengthFit: Number(r.metrics.lengthFit ?? 0),
                structure: Number(r.metrics.structure ?? 0),
                composite: Number(r.metrics.composite ?? 0),
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ id: experiment.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Import failed" }, { status: 500 });
  }
}
