import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#3D5A45] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[#3D5A45]/20 bg-[#3D5A45]/10 text-[#3D5A45]",
        secondary: "border-[#C08A3E]/20 bg-[#C08A3E]/10 text-[#A6742A]",
        destructive: "border-[#B5533C]/20 bg-[#B5533C]/10 text-[#B5533C]",
        success: "border-[#3D5A45]/20 bg-[#3D5A45]/10 text-[#3D5A45]",
        warning: "border-[#C08A3E]/20 bg-[#C08A3E]/10 text-[#A6742A]",
        outline: "border-[#E3DFD4] text-[#2B2925]",
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
