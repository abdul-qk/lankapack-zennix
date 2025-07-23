import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    // Fetch the total number of rows from both tables
    const jobcardCount = await prisma.hps_jobcard.count();
    const cuttingCount = await prisma.hps_cutting.count();
    const slittingCount = await prisma.hps_slitting.count();
    const customerCount = await prisma.hps_customer.count();

    // Combine the results
    const data = {
      jobcardCount,
      cuttingCount,
      slittingCount,
      customerCount,
    };

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}
