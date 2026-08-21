import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./TextField.module.css";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  helperText?: string;
  errorText?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, icon, helperText, errorText, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className={cn(styles.field, className)}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        <div className={cn(styles.inputWrap, errorText && styles.error)}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input ref={ref} id={inputId} className={styles.input} {...props} />
        </div>
        {errorText ? (
          <p className={styles.errorText}>{errorText}</p>
        ) : helperText ? (
          <p className={styles.helper}>{helperText}</p>
        ) : null}
      </div>
    );
  },
);

TextField.displayName = "TextField";
