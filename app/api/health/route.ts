import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint for monitoring and load balancer probes.
 * GET /api/health - Returns 200 if DB is reachable, 503 otherwise.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
