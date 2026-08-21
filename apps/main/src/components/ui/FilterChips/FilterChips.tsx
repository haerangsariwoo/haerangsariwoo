"use client";

import { cn } from "@/lib/cn";
import styles from "./FilterChips.module.css";

interface FilterChipsProps {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}

export function FilterChips({ options, value, onChange, label }: FilterChipsProps) {
  return (
    <div className={styles.row} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="tab"
          aria-selected={value === o}
          className={cn(styles.chip, value === o && styles.active)}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
