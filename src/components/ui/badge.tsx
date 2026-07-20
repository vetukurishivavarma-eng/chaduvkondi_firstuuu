import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#3D5A45] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]",
        secondary: "border-[var(--secondary)]/20 bg-[var(--secondary)]/10 text-[var(--secondary)]",
        destructive: "border-[var(--error)]/20 bg-[var(--error)]/10 text-[var(--error)]",
        success: "border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]",
        warning: "border-[var(--secondary)]/20 bg-[var(--secondary)]/10 text-[var(--secondary)]",
        outline: "border-[var(--border)] text-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
