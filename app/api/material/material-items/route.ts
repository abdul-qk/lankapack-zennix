export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://calc.lankapack.com",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // 24 hours
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(req: Request) {
  try {
    // Fetch all filtered material info data with valid suppliers
    const materialItems = await prisma.hps_material_item.findMany({
        include: {
            particular: {
                select: {
                    particular_name: true,
                }
            },
        },
        distinct: ['material_item_size'],

    });
    console.log(materialItems);


    return new Response(JSON.stringify({ data: materialItems }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error fetching material items:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}