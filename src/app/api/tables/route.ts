import { NextResponse } from "next/server";
import { getTables } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tables = await getTables();
    return NextResponse.json(tables);
  } catch (error) {
    console.error("GET /api/tables failed:", error);
    return NextResponse.json({ error: "Failed to load tables" }, { status: 500 });
  }
}
