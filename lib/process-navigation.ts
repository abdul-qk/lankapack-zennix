/**
 * Check if related processes exist for a given job_card_id
 * @param jobCardId - The job card ID to check
 * @returns Object indicating which processes exist
 */
export async function checkRelatedProcesses(jobCardId: number): Promise<{
  hasSlitting: boolean;
  hasCutting: boolean;
  hasPrinting: boolean;
}> {
  const results = {
    hasSlitting: false,
    hasCutting: false,
    hasPrinting: false,
  };

  // Check all processes in parallel
  const [slittingResult, cuttingResult, printingResult] = await Promise.allSettled([
    fetch(`/api/slitting/${jobCardId}`),
    fetch(`/api/cutting/${jobCardId}`),
    fetch(`/api/printing/${jobCardId}`),
  ]);

  // Check slitting
  if (slittingResult.status === 'fulfilled' && slittingResult.value.ok) {
    results.hasSlitting = true;
  }

  // Check cutting
  if (cuttingResult.status === 'fulfilled' && cuttingResult.value.ok) {
    results.hasCutting = true;
  }

  // Check printing
  if (printingResult.status === 'fulfilled' && printingResult.value.ok) {
    results.hasPrinting = true;
  }

  return results;
}

