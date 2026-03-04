import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FiltersBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Modal bottom sheet for filters on mobile. Blocks background interaction.
 * Use for "Show Filters" UX: open this sheet with all filter controls inside.
 * Close button: full rounded, bg color, appropriate icon color.
 */
export function FiltersBottomSheet({
  open,
  onOpenChange,
  title = "Filters",
  children,
  className,
}: FiltersBottomSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className={cn(
          "max-md:max-h-[85vh] max-md:flex max-md:flex-col max-md:p-4 max-md:pb-6",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
          <DialogTitle className="text-lg font-semibold m-0">
            {title}
          </DialogTitle>
          <DialogClose
            className="rounded-full size-10 flex items-center justify-center bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="size-5 shrink-0" />
          </DialogClose>
        </div>
        <div className="flex flex-col gap-3 w-full min-h-0 overflow-y-auto mt-3">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
