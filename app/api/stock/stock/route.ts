export const dynamic = 'force-dynamic';

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const materialId = url.searchParams.get("materialId");
    const outdatepicker = url.searchParams.get("outdatepicker");
    const indatepicker = url.searchParams.get("indatepicker");
    const size_id = url.searchParams.get("size_id");
    const status_id = url.searchParams.get("status_id");
    const item_gsm = url.searchParams.get("item_gsm");

    console.log("Query parameters:", {
      materialId,
      outdatepicker,
      indatepicker,
      size_id,
      status_id,
      item_gsm,
    });

    // Build where conditions
    const whereConditions: any = {
      main_id: {
        not: 1,
      },
    };

    // Material ID filter
    if (materialId && materialId !== "" && materialId !== "all") {
      whereConditions.material_item_particular = parseInt(materialId, 10);
    }

    // Status filter
    if (
      status_id &&
      status_id !== "" &&
      status_id !== "3" &&
      status_id !== "all"
    ) {
      whereConditions.material_status = parseInt(status_id, 10);
    }

    // Size filter - strip CM if present
    if (size_id && size_id !== "" && size_id !== "all") {
      whereConditions.material_item_size = size_id.replace("CM", "").trim();
    }

    // GSM filter - strip GSM if present
    if (item_gsm && item_gsm !== "" && item_gsm !== "all") {
      whereConditions.item_gsm = item_gsm.replace("GSM", "").trim();
    }

    // Date range filter
    if (indatepicker && outdatepicker) {
      try {
        const inDate = new Date(indatepicker);
        const outDate = new Date(outdatepicker);

        // Add one day to the outDate to make it inclusive
        outDate.setDate(outDate.getDate() + 1);

        whereConditions.stock_date = {
          gte: inDate,
          lt: outDate,
        };
      } catch (e) {
        console.error("Error parsing dates:", e);
      }
    }

    console.log("Where conditions:", JSON.stringify(whereConditions, null, 2));

    // Get stock data
    const stockData = await prisma.hps_stock.findMany({
      where: whereConditions,
      orderBy: {
        stock_id: "desc",
      },
    });

    console.log(`Found ${stockData.length} records`);

    // Get all particulars for lookup
    const particulars = await prisma.hps_particular.findMany({
      where: {
        particular_status: 1, // Assuming 1 is active
      },
      orderBy: {
        particular_name: "asc",
      },
    });

    // Create an efficient lookup map
    const particularMap = new Map(
      particulars.map((p) => [p.particular_id, p.particular_name])
    );

    // Format response data
    const formattedData = stockData.map((item) => {
      // Format values properly

      // Determine status text
      const statusText = item.material_status === 0 ? "IN" : "OUT";

      // Determine department text
      let departmentText;
      switch (item.material_used_buy) {
        case 1:
          departmentText = "MRN";
          break;
        case 2:
          departmentText = "SLETTING";
          break;
        case 3:
          departmentText = "PRINTING";
          break;
        case 4:
          departmentText = "CUTTING";
          break;
        default:
          departmentText = "UNKNOWN";
      }

      // Get particular name from the map
      const particularName =
        particularMap.get(item.material_item_particular) || "Unknown";

      // Format date if needed
      const formattedDate = item.stock_date
        ? item.stock_date.toISOString()
        : null;

      return {
        stock_id: item.stock_id,
        material_item_particular: particularName,
        material_used_buy: departmentText,
        stock_date: formattedDate,
        material_item_id: item.material_item_id,
        item_gsm: `${item.item_gsm}GSM`,
        material_item_size: `${item.material_item_size}CM`,
        item_net_weight: item.item_net_weight,
        stock_barcode: item.stock_barcode.toString(),
        material_status: statusText,
      };
    });

    return new Response(
      JSON.stringify({
        data: { data: formattedData },
        particulars: particulars.map((p) => ({
          particular_id: p.particular_id,
          particular_name: p.particular_name,
        })),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch stock data",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
