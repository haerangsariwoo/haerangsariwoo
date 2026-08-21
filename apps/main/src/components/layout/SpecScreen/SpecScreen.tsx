import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button/Button";
import styles from "./SpecScreen.module.css";

type Tone = "sky" | "mint" | "warn";

export interface SpecBlock {
  title: string;
  desc: string;
  tone?: Tone;
  href?: string;
}

export interface SpecScreenProps {
  title: string;
  status?: string;
  blocks: SpecBlock[];
  note?: string;
  action?: { label: string; href: string };
}

const DEFAULT_TONES: Tone[] = ["sky", "mint", "warn"];

export function SpecScreen({ title, status, blocks, note, action }: SpecScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.head}>
        <h1 className={styles.title}>{title}</h1>
        {status && <span className={styles.statusBadge}>{status}</span>}
      </div>

      <div className={styles.blocks}>
        {blocks.map((block, i) => {
          const tone = block.tone ?? DEFAULT_TONES[i % DEFAULT_TONES.length];
          const inner = (
            <>
              <span className={cn(styles.blockIcon, styles[tone])} />
              <span>
                <span className={styles.blockTitle}>{block.title}</span>
                <span className={styles.blockDesc}>{block.desc}</span>
              </span>
            </>
          );
          return block.href ? (
            <Link key={block.title} href={block.href} className={styles.block}>
              {inner}
            </Link>
          ) : (
            <div key={block.title} className={styles.block}>
              {inner}
            </div>
          );
        })}
      </div>

      {note && <p className={styles.ruleNote}>{note}</p>}

      <div className={styles.spacer} />

      {action && (
        <Link href={action.href}>
          <Button variant="navy" size="md" fullWidth>
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  );
}
