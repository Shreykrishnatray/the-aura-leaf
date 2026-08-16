import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root
      className={cn(
        "text-sm font-medium leading-none text-charcoal",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-pointer-events-none",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Label.displayName = "Label";
