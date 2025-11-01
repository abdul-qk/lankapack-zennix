'use client'

import { AppSidebar } from "@/components/app-sidebar"
import Loading from "@/components/layouts/loading"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Users, FileText, CheckCircle2, Clock, AlertCircle, Receipt } from "lucide-react"

interface DashboardData {
  // Basic counts
  jobcardCount: number;
  cuttingCount: number;
  slittingCount: number;
  printingCount: number;
  customerCount: number;
  
  // Job card status
  pendingSlitting: number;
  pendingPrinting: number;
  pendingCutting: number;
  completedJobCards: number;
  jobCardsThisMonth: number;
  
  // Sales statistics (counts only)
  totalInvoices: number;
  invoicesThisMonth: number;
  invoicesThisYear: number;
  
  // Stock
  stockInHand: number;
  rawStockCount: number;
  materialReceivedThisMonth: number;
  
  // Trends
  monthlyJobCards: { month: string; count: number }[];
  monthlyInvoices: { month: string; count: number }[];
  
  // Recent activity
  recentJobCards: {
    job_card_id: number;
    customer_name: string;
    add_date: string;
    delivery_date: string;
    status: { slitting: boolean; printing: boolean; cutting: boolean };
  }[];
  
  upcomingDeliveries: {
    job_card_id: number;
    customer_name: string;
    delivery_date: string;
    status: { slitting: boolean; printing: boolean; cutting: boolean };
  }[];
}

export default function Page() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const jobCardsChartConfig = {
    count: {
      label: "Job Cards",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const invoicesChartConfig = {
    count: {
      label: "Invoices",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  if (loading) return <Loading />;

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Key Metrics */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Job Cards</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.jobcardCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.jobCardsThisMonth || 0} created this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.totalInvoices || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.invoicesThisMonth || 0} this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.customerCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total active customers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data?.completedJobCards || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Fully completed job cards
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Job Card Status */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Slitting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{data?.pendingSlitting || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting slitting process</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Printing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{data?.pendingPrinting || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting printing process</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Cutting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{data?.pendingCutting || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting cutting process</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{data?.completedJobCards || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Fully completed job cards</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.totalInvoices || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.invoicesThisYear || 0} this year
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Stock in Hand</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.stockInHand || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Finished goods ready</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Raw Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.rawStockCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Raw materials available</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Materials Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.materialReceivedThisMonth || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Cards Trend</CardTitle>
                <CardDescription>
                  Job cards created over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={jobCardsChartConfig} className="min-h-[250px] w-full">
                  <BarChart accessibilityLayer data={data?.monthlyJobCards || []}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Invoices Trend</CardTitle>
                <CardDescription>
                  Invoices generated over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={invoicesChartConfig} className="min-h-[250px] w-full">
                  <BarChart accessibilityLayer data={data?.monthlyInvoices || []}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Job Cards</CardTitle>
                <CardDescription>Latest 5 job cards created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.recentJobCards && data.recentJobCards.length > 0 ? (
                    data.recentJobCards.map((job) => (
                      <div key={job.job_card_id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{job.customer_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Created: {formatDate(job.add_date)}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {job.status.slitting ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Clock className="h-3 w-3 text-orange-600" />
                            )}
                            {job.status.printing ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Clock className="h-3 w-3 text-blue-600" />
                            )}
                            {job.status.cutting ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Clock className="h-3 w-3 text-purple-600" />
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <p>ID: {job.job_card_id}</p>
                          {job.delivery_date && (
                            <p className="mt-1">Delivery: {formatDate(job.delivery_date)}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent job cards</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deliveries</CardTitle>
                <CardDescription>Next 5 deliveries scheduled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.upcomingDeliveries && data.upcomingDeliveries.length > 0 ? (
                    data.upcomingDeliveries.map((job) => {
                      const isPending = !job.status.slitting || !job.status.printing || !job.status.cutting;
                      return (
                        <div key={job.job_card_id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{job.customer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Delivery: {formatDate(job.delivery_date)}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {job.status.slitting ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-orange-600" />
                              )}
                              {job.status.printing ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-blue-600" />
                              )}
                              {job.status.cutting ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-purple-600" />
                              )}
                            </div>
                            {isPending && (
                              <p className="text-xs text-orange-600 font-medium mt-1">
                                Action Required
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            <p>ID: {job.job_card_id}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No upcoming deliveries</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
