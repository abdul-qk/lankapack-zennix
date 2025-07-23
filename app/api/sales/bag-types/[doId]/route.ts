import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { doId: string } }
) {
  try {
    const doId = parseInt(params.doId);

    if (isNaN(doId)) {
      return NextResponse.json(
        { success: false, error: "Invalid DO ID format" },
        { status: 400 }
      );
    }

    // Fetch sales items for the given DO number
    const salesItems = await prisma.hps_sales_item.findMany({
      where: {
        sales_info_id: doId,
        sales_status: 0, // Active/valid items
      },
      select: {
        sales_item_id: true,
        bundle_type: true,
        n_weight: true,
        no_of_bags: true,
        item_price: true,
      },
    });

    // Get all bag types for mapping
    const bagTypes = await prisma.hps_bag_type.findMany({
      select: {
        bag_id: true,
        bag_type: true,
        bag_price: true,
      },
    });

    // Create a map of bag type names to bag IDs
    const bagTypeNameToIdMap = new Map();
    const bagIdToTypeMap = new Map();

    bagTypes.forEach((bt) => {
      bagTypeNameToIdMap.set(bt.bag_type.toLowerCase(), bt.bag_id);
      bagIdToTypeMap.set(bt.bag_id, {
        type: bt.bag_type,
        price: bt.bag_price,
      });
    });

    // console.log("Bag Type Map:", bagTypeNameToIdMap);
    // console.log("Bag ID to Type Map:", bagIdToTypeMap);

    // Extract unique bag types
    const uniqueBagTypes = [];
    const seenBundleTypes = new Set();

    for (const item of salesItems) {
      if (!seenBundleTypes.has(item.bundle_type)) {
        seenBundleTypes.add(item.bundle_type);

        let bagTypeId, bagTypeName;

        // Check if bundle_type is already a numeric ID
        if (typeof item.bundle_type === "number") {
          console.log("Bundle type is already a number:", item.bundle_type);
          bagTypeId = item.bundle_type;
          const bagInfo = bagIdToTypeMap.get(bagTypeId);
          bagTypeName = bagInfo ? bagInfo.type : `Unknown Type (${bagTypeId})`;
        }
        // Check if bundle_type is a string that contains a numeric ID
        // else if (
        //   console.log("Bundle type is a string and has number:", item.bundle_type),
        //   typeof item.bundle_type === "string" &&
        //   !isNaN(parseInt(item.bundle_type))
        // ) {
        //   bagTypeId = parseInt(item.bundle_type);
        //   const bagInfo = bagIdToTypeMap.get(bagTypeId);
        //   bagTypeName = bagInfo ? bagInfo.type : `Unknown Type (${bagTypeId})`;
        // }
        // Check if bundle_type is a string that matches a bag type name
        else if (typeof item.bundle_type === "string") {
          console.log("Bundle type is a string:", item.bundle_type);
          // Try to find the bag ID by name
          bagTypeId = bagTypeNameToIdMap.get(item.bundle_type.toLowerCase());

          if (!bagTypeId) {
            // If no direct match, try to find the closest match
            // This is a fallback for when bundle_type is a description instead of exact bag_type
            // Using Array.from to avoid TypeScript iterator issues
            const entries = Array.from(bagTypeNameToIdMap.keys());
            for (const typeName of entries) {
              if (
                item.bundle_type.toLowerCase().includes(typeName) ||
                typeName.includes(item.bundle_type.toLowerCase())
              ) {
                bagTypeId = bagTypeNameToIdMap.get(typeName);
                break;
              }
            }
          }

          // If we still don't have a bag type ID, generate a temporary one for UI purposes
          if (!bagTypeId) {
            console.warn(`No matching bag type found for: ${item.bundle_type}`);
            // Use a negative ID to indicate it's not a real bag type ID
            bagTypeId = -1 * item.sales_item_id;
          }

          bagTypeName = item.bundle_type;
        }

        uniqueBagTypes.push({
          id: item.sales_item_id,
          bagTypeId: bagTypeId, // The actual bag_id from hps_bag_type
          type: bagTypeName, // The bag type name
          price: item.item_price || "0",
          weight: item.n_weight || 0,
          bags: item.no_of_bags || 0,
        });
      }
    }

    // Log the response for debugging
    console.log("Returning bag types:", uniqueBagTypes);

    return NextResponse.json({
      success: true,
      data: uniqueBagTypes,
    });
  } catch (error) {
    console.error("Error fetching bag types:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bag types" },
      { status: 500 }
    );
  }
}
