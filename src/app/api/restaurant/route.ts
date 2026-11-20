import { NextResponse } from "next/server";
import { getRestaurant } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const restaurant = await getRestaurant();
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }
    return NextResponse.json(restaurant);
  } catch (error) {
    console.error("GET /api/restaurant failed:", error);
    return NextResponse.json({ error: "Failed to load restaurant" }, { status: 500 });
  }
}
