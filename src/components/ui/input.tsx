import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#E3DFD4] bg-[#FAF8F4] px-3.5 py-2 text-sm text-[#2B2925] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#9C9A94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D5A45]/30 focus-visible:border-[#3D5A45] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
