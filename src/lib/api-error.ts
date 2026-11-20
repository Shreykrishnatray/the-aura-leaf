import { NextResponse } from "next/server";
import { OrderError } from "./orders";

/**
 * Converts thrown errors into JSON responses.
 *
 * Expected, user-facing problems (validation, conflicts, missing rows) are
 * raised as `OrderError`; anything else is logged and reported generically so
 * database internals never reach the client.
 */
export function errorResponse(error: unknown, context: string): NextResponse {
  if (error instanceof OrderError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(`${context} failed:`, error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
