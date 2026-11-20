import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-error";
import {
  OrderError,
  getOrderById,
  parseUpdateOrderStatusInput,
  updateOrderStatus,
} from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/orders/[id] — a single order with its items and customizations. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    return errorResponse(error, "GET /api/orders/[id]");
  }
}

/** PATCH /api/orders/[id] — moves an order along the preparation flow. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new OrderError(400, "Request body must be valid JSON.");
    }

    const { status } = parseUpdateOrderStatusInput(body);
    const order = await updateOrderStatus(id, status);
    return NextResponse.json(order);
  } catch (error) {
    return errorResponse(error, "PATCH /api/orders/[id]");
  }
}
