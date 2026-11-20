import { NextResponse } from "next/server";
import { getMenuItems } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getMenuItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET /api/menu-items failed:", error);
    return NextResponse.json({ error: "Failed to load menu items" }, { status: 500 });
  }
}
