"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./TextField.module.css";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  helperText?: string;
  errorText?: string;
  /**
   * 비밀번호 칸에 눈 모양 단추를 붙인다.
   * 안 보이는 채로 길게 치다 보면 어디서 틀렸는지 알 수 없어, 로그인이
   * 안 되는 이유가 오타인지 비밀번호가 다른 것인지 구분이 안 된다.
   */
  revealable?: boolean;
}

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.8" />
    {off && <path d="M4 20 20 4" />}
  </svg>
);

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, icon, helperText, errorText, revealable, id, className, type, ...props }, ref) => {
    const inputId = id ?? props.name;
    const [shown, setShown] = useState(false);

    // 눈 단추를 누르면 같은 칸이 그냥 글자 칸이 된다
    const inputType = revealable && shown ? "text" : type;

    return (
      <div className={cn(styles.field, className)}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        <div className={cn(styles.inputWrap, errorText && styles.error)}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input ref={ref} id={inputId} className={styles.input} type={inputType} {...props} />
          {revealable && (
            <button
              type="button"
              className={styles.reveal}
              onClick={() => setShown((v) => !v)}
              aria-label={shown ? "비밀번호 숨기기" : "비밀번호 표시"}
              aria-pressed={shown}
              // 단추를 눌러도 입력하던 자리를 잃지 않게 한다
              tabIndex={-1}
            >
              <EyeIcon off={shown} />
            </button>
          )}
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
