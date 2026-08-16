import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-forest text-white",
        secondary: "bg-gold/15 text-forest-dark",
        outline: "border border-stone text-forest-dark",
        soft: "bg-forest/10 text-forest",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-success text-white",
        warning: "bg-warning text-ink",
        ghost: "text-sage",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
