import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "soft"
  | "destructive"
  | "link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
}

const buttonVariants = {
  base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium outline-none transition-all duration-150 disabled:pointer-events-none disabled:opacity-50",
  sizes: {
    sm: "h-9 px-3.5 text-sm",
    md: "h-11 px-5 py-2.5 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10",
  },
  variants: {
    primary:
      "bg-forest text-white shadow-md hover:bg-forest-dark active:translate-y-[1px] active:shadow-lg",
    secondary:
      "bg-gold text-forest-dark shadow-sm hover:bg-gold-deep active:translate-y-[1px]",
    outline:
      "border border-stone bg-card text-foreground hover:bg-sage/30",
    ghost: "text-foreground hover:bg-stone/40",
    soft:
      "bg-forest/10 text-forest hover:bg-forest/20",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    link: "text-forest underline-offset-4 hover:underline",
  },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const sizeClasses =
      size === "sm" ? buttonVariants.sizes.sm : size === "lg" ? buttonVariants.sizes.lg : size === "icon" ? buttonVariants.sizes.icon : buttonVariants.sizes.md;
    const variantClasses =
      variant === "primary"
        ? buttonVariants.variants.primary
        : variant === "secondary"
        ? buttonVariants.variants.secondary
        : variant === "outline"
        ? buttonVariants.variants.outline
        : variant === "ghost"
        ? buttonVariants.variants.ghost
        : variant === "soft"
        ? buttonVariants.variants.soft
        : variant === "destructive"
        ? buttonVariants.variants.destructive
        : buttonVariants.variants.link;
    return (
      <Comp
        className={cn(buttonVariants.base, sizeClasses, variantClasses, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
