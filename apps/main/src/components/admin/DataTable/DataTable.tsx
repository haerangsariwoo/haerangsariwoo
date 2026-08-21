import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./DataTable.module.css";

export type BadgeTone = "blue" | "green" | "orange" | "purple" | "grey";

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={cn(styles.badge, styles[tone])}>{children}</span>;
}

export function RowAction({
  children,
  primary,
}: {
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <button type="button" className={cn(styles.rowAction, primary && styles.primary)}>
      {children}
    </button>
  );
}

interface DataTableProps {
  columns: string[];
  children: ReactNode;
  empty?: string;
  isEmpty?: boolean;
}

export function DataTable({ columns, children, empty, isEmpty }: DataTableProps) {
  if (isEmpty) {
    return <p className={styles.empty}>{empty ?? "표시할 항목이 없습니다."}</p>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const tableStyles = styles;
