"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
};

export function useConfirmAction() {
  const [state, setState] = React.useState<ConfirmState | null>(null);
  const [busy, setBusy] = React.useState(false);

  const requestConfirm = React.useCallback(
    (
      title: string,
      description: string,
      onConfirm: () => void | Promise<void>,
      confirmLabel = "Confirm"
    ) => {
      setState({ title, description, onConfirm, confirmLabel });
    },
    []
  );

  const dialog = (
    <AlertDialog
      open={!!state}
      onOpenChange={(open) => {
        if (!open && !busy) setState(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {state?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async (e) => {
              e.preventDefault();
              if (!state) return;
              setBusy(true);
              try {
                await state.onConfirm();
                setState(null);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Working..." : state?.confirmLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { requestConfirm, dialog };
}
