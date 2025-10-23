import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const experiments = await prisma.experiment.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { runs: true } },
    },
  });
  return NextResponse.json({ experiments });
}
