import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Basic counts
    const jobcardCount = await prisma.hps_jobcard.count({
      where: { del_ind: 0 }
    });
    const cuttingCount = await prisma.hps_cutting.count({
      where: { del_ind: 0 }
    });
    const slittingCount = await prisma.hps_slitting.count({
      where: { del_ind: 0 }
    });
    const printingCount = await prisma.hps_print.count({
      where: { del_ind: 0 }
    });
    const customerCount = await prisma.hps_customer.count({
      where: { del_ind: 0 }
    });

    // Job cards by status
    const pendingSlitting = await prisma.hps_jobcard.count({
      where: {
        del_ind: 0,
        card_slitting: 0,
        OR: [
          { section_list: "1" },
          { section_list: { startsWith: "1," } },
          { section_list: { endsWith: ",1" } },
          { section_list: { contains: ",1," } }
        ]
      }
    });

    const pendingPrinting = await prisma.hps_jobcard.count({
      where: {
        del_ind: 0,
        card_printting: 0,
        card_slitting: 1,
        OR: [
          { section_list: "2" },
          { section_list: { startsWith: "2," } },
          { section_list: { endsWith: ",2" } },
          { section_list: { contains: ",2," } }
        ]
      }
    });

    const pendingCutting = await prisma.hps_jobcard.count({
      where: {
        del_ind: 0,
        card_cutting: 0,
        card_printting: 1,
        OR: [
          { section_list: "3" },
          { section_list: { startsWith: "3," } },
          { section_list: { endsWith: ",3" } },
          { section_list: { contains: ",3," } }
        ]
      }
    });

    const completedJobCards = await prisma.hps_jobcard.count({
      where: {
        del_ind: 0,
        card_slitting: 1,
        card_printting: 1,
        card_cutting: 1
      }
    });

    // Sales statistics (invoice counts only, no revenue)
    const totalInvoices = await prisma.hps_bill_info.count({
      where: { del_ind: 1 }
    });

    const invoicesThisMonth = await prisma.hps_bill_info.count({
      where: {
        del_ind: 1,
        add_date: { gte: startOfMonth }
      }
    });

    const invoicesThisYear = await prisma.hps_bill_info.count({
      where: {
        del_ind: 1,
        add_date: { gte: startOfYear }
      }
    });

    // Job cards created this month
    const jobCardsThisMonth = await prisma.hps_jobcard.count({
      where: {
        del_ind: 0,
        add_date: { gte: startOfMonth }
      }
    });

    // Recent job cards (last 5)
    const recentJobCards = await prisma.hps_jobcard.findMany({
      where: { del_ind: 0 },
      take: 5,
      orderBy: { add_date: "desc" },
      include: {
        customer: {
          select: { customer_full_name: true }
        }
      }
    });

    // Pending deliveries (upcoming delivery dates)
    const upcomingDeliveries = await prisma.hps_jobcard.findMany({
      where: {
        del_ind: 0,
        delivery_date: { not: "" }
      },
      take: 5,
      orderBy: { delivery_date: "asc" },
      include: {
        customer: {
          select: { customer_full_name: true }
        }
      }
    });

    // Monthly job cards trend (last 6 months)
    const monthlyJobCardsData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const count = await prisma.hps_jobcard.count({
        where: {
          del_ind: 0,
          add_date: { gte: monthStart, lte: monthEnd }
        }
      });

      monthlyJobCardsData.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        count
      });
    }

    // Monthly invoices trend (last 6 months) - count only, no revenue
    const monthlyInvoicesData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const count = await prisma.hps_bill_info.count({
        where: {
          del_ind: 1,
          add_date: { gte: monthStart, lte: monthEnd }
        }
      });

      monthlyInvoicesData.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        count
      });
    }

    // Stock statistics
    const stockInHand = await prisma.hps_complete_item.count({
      where: { del_ind: 1 }
    });

    const rawStockCount = await prisma.hps_stock.count({
      where: {
        main_id: { not: 1 },
        material_status: { not: 3 }
      }
    });

    // Material receiving this month
    const materialReceivedThisMonth = await prisma.hps_material_info.count({
      where: {
        add_date: { gte: startOfMonth },
        material_info_status: 1
      }
    });

    // Combine all results
    const data = {
      // Basic counts
      jobcardCount,
      cuttingCount,
      slittingCount,
      printingCount,
      customerCount,
      
      // Job card status
      pendingSlitting,
      pendingPrinting,
      pendingCutting,
      completedJobCards,
      jobCardsThisMonth,
      
      // Sales statistics (counts only)
      totalInvoices,
      invoicesThisMonth,
      invoicesThisYear,
      
      // Stock
      stockInHand,
      rawStockCount,
      materialReceivedThisMonth,
      
      // Trends
      monthlyJobCards: monthlyJobCardsData,
      monthlyInvoices: monthlyInvoicesData,
      
      // Recent activity
      recentJobCards: recentJobCards.map(jc => ({
        job_card_id: jc.job_card_id,
        customer_name: jc.customer.customer_full_name,
        add_date: jc.add_date,
        delivery_date: jc.delivery_date,
        status: {
          slitting: jc.card_slitting === 1,
          printing: jc.card_printting === 1,
          cutting: jc.card_cutting === 1
        }
      })),
      
      upcomingDeliveries: upcomingDeliveries.map(jc => ({
        job_card_id: jc.job_card_id,
        customer_name: jc.customer.customer_full_name,
        delivery_date: jc.delivery_date,
        status: {
          slitting: jc.card_slitting === 1,
          printing: jc.card_printting === 1,
          cutting: jc.card_cutting === 1
        }
      }))
    };

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
      status: 500,
    });
  }
}
