"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { checkRelatedProcesses } from "@/lib/process-navigation";
import { ArrowRight } from "lucide-react";

interface ProcessNavigationProps {
  jobCardId: number;
  currentProcess: "slitting" | "cutting" | "printing";
  currentPageType: "edit" | "view";
}

export default function ProcessNavigation({
  jobCardId,
  currentProcess,
  currentPageType,
}: ProcessNavigationProps) {
  const [relatedProcesses, setRelatedProcesses] = React.useState<{
    hasSlitting: boolean;
    hasCutting: boolean;
    hasPrinting: boolean;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRelatedProcesses = async () => {
      try {
        setLoading(true);
        const processes = await checkRelatedProcesses(jobCardId);
        setRelatedProcesses(processes);
      } catch (error) {
        console.error("Error checking related processes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (jobCardId) {
      fetchRelatedProcesses();
    }
  }, [jobCardId]);

  // Don't show anything if still loading or no related processes
  if (loading || !relatedProcesses) {
    return null;
  }

  // Filter out the current process
  const availableProcesses: Array<{
    name: string;
    path: string;
    exists: boolean;
  }> = [];

  if (relatedProcesses.hasSlitting && currentProcess !== "slitting") {
    availableProcesses.push({
      name: "Slitting",
      path: `/slitting/${currentPageType}/${jobCardId}`,
      exists: true,
    });
  }

  if (relatedProcesses.hasCutting && currentProcess !== "cutting") {
    availableProcesses.push({
      name: "Cutting",
      path: `/cutting/${currentPageType}/${jobCardId}`,
      exists: true,
    });
  }

  if (relatedProcesses.hasPrinting && currentProcess !== "printing") {
    availableProcesses.push({
      name: "Printing",
      path: `/printing/${currentPageType}/${jobCardId}`,
      exists: true,
    });
  }

  // Don't render if no related processes
  if (availableProcesses.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-gray-700">
        Related Processes
      </h3>
      <div className="flex flex-wrap gap-3">
        {availableProcesses.map((process) => (
          <Link key={process.path} href={process.path}>
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              {process.name}
              <ArrowRight size={16} />
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

