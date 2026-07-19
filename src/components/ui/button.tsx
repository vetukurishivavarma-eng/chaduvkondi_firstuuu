import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D5A45] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#3D5A45] text-[#F5F1E8] hover:bg-[#4B6E55] shadow-sm hover:shadow-md border border-[#2D4635]",
        destructive: "bg-[#B5533C] text-[#F5F1E8] hover:bg-[#CC6B54] shadow-sm border border-[#9A4630]",
        outline: "border border-[#E3DFD4] bg-[#FAF8F4] text-[#2B2925] hover:bg-[#EDE9DF] hover:border-[#C08A3E]",
        secondary: "bg-[#C08A3E] text-[#FAF8F4] hover:bg-[#D4A45A] shadow-sm border border-[#A6742A]",
        ghost: "text-[#2B2925] hover:bg-[#EDE9DF] hover:text-[#3D5A45]",
        link: "text-[#3D5A45] underline-offset-4 hover:underline decoration-[#C08A3E] decoration-2",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-7 text-base",
        xl: "h-14 rounded-xl px-9 text-lg",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
