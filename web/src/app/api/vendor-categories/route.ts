import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/responses";

export async function GET() {
  try {
    const categories = await prisma.vendorCategory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories }, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[vendor-categories] Error:", err);
    return serverError();
  }
}
