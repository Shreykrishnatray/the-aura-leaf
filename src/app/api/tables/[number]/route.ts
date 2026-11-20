import { NextResponse } from "next/server";
import { getTableByNumber } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params;
    const table = await getTableByNumber(number);
    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }
    return NextResponse.json(table);
  } catch (error) {
    console.error("GET /api/tables/[number] failed:", error);
    return NextResponse.json({ error: "Failed to load table" }, { status: 500 });
  }
}
