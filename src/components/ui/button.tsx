import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D5A45] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-[var(--background)] hover:bg-[var(--primary-light)] shadow-sm hover:shadow-md border border-[var(--primary-dark)]",
        destructive: "bg-[var(--error)] text-[var(--background)] hover:bg-[var(--error-light)] shadow-sm border border-[var(--error)]/60",
        outline: "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--soft)] hover:border-[var(--secondary)]",
        secondary: "bg-[var(--secondary)] text-[var(--surface)] hover:bg-[var(--secondary-light)] shadow-sm border border-[var(--secondary)]/60",
        ghost: "text-[var(--foreground)] hover:bg-[var(--soft)] hover:text-[var(--primary)]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline decoration-[var(--secondary)] decoration-2",
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
