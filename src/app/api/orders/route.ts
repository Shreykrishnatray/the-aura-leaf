import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-error";
import {
  OrderError,
  createOrder,
  getOrdersBySession,
  parseCreateOrderInput,
} from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

/** GET /api/orders?sessionId=ABC123 — orders for one dining session. */
export async function GET(request: Request) {
  try {
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
    }
    if (!SESSION_ID_PATTERN.test(sessionId)) {
      return NextResponse.json({ error: "Invalid session id." }, { status: 400 });
    }

    const orders = await getOrdersBySession(sessionId);
    return NextResponse.json(orders);
  } catch (error) {
    return errorResponse(error, "GET /api/orders");
  }
}

/** POST /api/orders — validates the cart and creates a persisted order. */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new OrderError(400, "Request body must be valid JSON.");
    }

    const input = parseCreateOrderInput(body);
    const order = await createOrder(input);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return errorResponse(error, "POST /api/orders");
  }
}
