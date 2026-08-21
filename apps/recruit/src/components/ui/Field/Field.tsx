import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "./Field.module.css";

interface BaseProps {
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
}

export function TextField({
  label,
  required,
  help,
  error,
  className,
  ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn(styles.field, className)}>
      <label className={styles.label} htmlFor={props.name}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <input
        id={props.name}
        className={cn(styles.input, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? <p className={styles.error}>{error}</p> : help ? <p className={styles.help}>{help}</p> : null}
    </div>
  );
}

export function TextArea({
  label,
  required,
  help,
  error,
  maxLength,
  value,
  className,
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const length = typeof value === "string" ? value.length : 0;

  return (
    <div className={cn(styles.field, className)}>
      <label className={styles.label} htmlFor={props.name}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <textarea
        id={props.name}
        className={cn(styles.textarea, error && styles.invalid)}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {maxLength && (
        <span className={styles.counter}>
          {length} / {maxLength}자
        </span>
      )}
      {error ? <p className={styles.error}>{error}</p> : help ? <p className={styles.help}>{help}</p> : null}
    </div>
  );
}
