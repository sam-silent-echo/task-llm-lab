import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id?: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing experiment id" }, { status: 400 });
  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: {
      runs: {
        orderBy: { createdAt: "asc" },
        include: {
          response: {
            include: { metrics: true },
          },
        },
      },
    },
  });
  if (!experiment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ experiment });
}
