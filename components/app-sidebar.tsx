"use client"

import * as React from "react"
import {
  AudioWaveform,
  BadgeDollarSign,
  BookOpen,
  Bot,
  BrickWall,
  Command,
  Contact,
  DraftingCompass,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Printer,
  Scissors,
  Settings2,
  SquareActivity,
  SquareTerminal,
  Layers,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useAuth } from "@/hooks/use-auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  teams:
  {
    name: "Lankapack",
    logo: "/logo.png",
    plan: "Zennix",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
      items: [],
    },
    {
      title: "Material",
      url: "#",
      icon: BrickWall,
      items: [
        {
          title: "Material Receiving Note",
          url: "/material/material-receiving-note",
        },
        {
          title: "Particular",
          url: "/material/particular",
        },
      ],
    },
    {
      title: "Job Card Manager",
      url: "#",
      icon: Contact,
      items: [
        {
          title: "Job Card",
          url: "/job/jobCard",
        },
        {
          title: "Roll Types",
          url: "/job/rollType",
        },
        {
          title: "Cutting Types",
          url: "/job/cuttingType",
        },
        {
          title: "Bag Types",
          url: "/job/bagType",
        },
        {
          title: "Sheet Types",
          url: "/job/sheetType",
        },
        {
          title: "Print Sizes",
          url: "/job/printSizes",
        },
        {
          title: "Colours",
          url: "/job/colour",
        },
        {
          title: "Customer",
          url: "/job/customer",
        },
        {
          title: "Supplier",
          url: "/job/supplier",
        },
      ],
    },
    {
      title: "Slitting",
      url: "/slitting",
      icon: DraftingCompass,
    },
    {
      title: "Printing",
      url: "/printing",
      icon: Printer,
    },
    {
      title: "Cutting",
      url: "/cutting",
      icon: Scissors,
    },
    {
      title: "Sheeting",
      url: "/sheeting",
      icon: Layers,
    },
    {
      title: "Stock Management",
      url: "#",
      icon: SquareActivity,
      items: [
        {
          title: "Stock In Hand-FG",
          url: "/stock/stockInHand",
        },
        {
          title: "Stock-Roll",
          url: "/stock/stock",
        },
        {
          title: "Bundles/Pack",
          url: "/stock/bundles",
        },
        {
          title: "Finishing Goods",
          url: "/stock/finishingGoods",
        },
      ]
    },
    {
      title: "Sales Management",
      url: "#",
      icon: BadgeDollarSign,
      items: [
        {
          title: "Return",
          url: "/sales/return",
        },
        {
          title: "Invoice",
          url: "/sales/invoice",
        },
        {
          title: "DO",
          url: "/sales/do",
        },
      ]
    },
  ],
  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: Frame,
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: PieChart,
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: Map,
  //   },
  // ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const displayUser = {
    name: user?.fullName || user?.username || "User",
    email: user?.email || user?.userLevel || "",
    avatar: "/logo.png",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
