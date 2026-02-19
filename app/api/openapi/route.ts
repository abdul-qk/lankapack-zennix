import { openApiSpec } from "@/lib/openapi-spec";
import { NextResponse } from "next/server";

/**
 * Serves the OpenAPI 3.0 spec as JSON for Swagger UI and other consumers.
 * GET /api/openapi
 */
export async function GET() {
  return NextResponse.json(openApiSpec);
}
