export const dynamic = "force-dynamic";
// Get all data from hps_slitting
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const sheetingInfo = await prisma.hps_jobcard.findMany({
      include: {
        customer: true,
        particular: true,
      },
      where: {
        OR: [
          { section_list: "4" },
          { section_list: { startsWith: "4," } },
          { section_list: { endsWith: ",4" } },
          { section_list: { contains: ",4," } },
        ],
      },
      orderBy: {
        job_card_id: "asc",
      },
    });

    const sheetTypes = await prisma.hps_sheet_type.findMany();
    const sheetTypeMap = new Map(
      sheetTypes.map((st) => [st.sheet_id.toString(), st.sheet_type])
    );

    const data = sheetingInfo.map((item) => ({
      ...item,
      sheetTypeName: item.sheeting_barcode
        ? sheetTypeMap.get(item.sheeting_barcode) || item.sheeting_barcode
        : null,
    }));

    return new Response(JSON.stringify({ data }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching slitting info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}
