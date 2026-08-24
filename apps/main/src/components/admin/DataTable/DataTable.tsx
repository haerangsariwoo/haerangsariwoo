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
  onClick,
  title,
  disabled,
}: {
  children: ReactNode;
  primary?: boolean;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(styles.rowAction, primary && styles.primary)}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

interface DataTableProps {
  /** 문자열 외에 체크박스 같은 요소도 헤더에 넣을 수 있다 */
  columns: ReactNode[];
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
            {columns.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const tableStyles = styles;
