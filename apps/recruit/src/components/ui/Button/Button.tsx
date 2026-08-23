import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "navy";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** 사진 위에 놓일 때 그림자를 약하게 (design.md §2.1) */
  onPhoto?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "lg", fullWidth, onPhoto, className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        onPhoto && styles.onPhoto,
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
