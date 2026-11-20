import { NextResponse } from "next/server";
import { getMenuItemBySlug } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const item = await getMenuItemBySlug(slug);
    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /api/menu-items/[slug] failed:", error);
    return NextResponse.json({ error: "Failed to load menu item" }, { status: 500 });
  }
}
