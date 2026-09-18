"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { shuffleTables, type Seat, type SeatGender } from "@/lib/table-shuffle";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./tableShuffle.module.css";

const MAX_TABLES = 30;
const SAVE_DELAY = 400;

interface SeatRow {
  id: string;
  table_number: number;
  seat_order: number;
  name: string;
  gender: SeatGender;
  is_staff: boolean;
}

interface Snapshot {
  rows: Map<string, SeatRow>;
  tableCount: number;
  even: boolean;
}

type SaveState = "saved" | "saving" | "error";

/** http 로 접속한 휴대폰처럼 crypto.randomUUID 가 없는 환경도 있다 */
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
  );
}

function snapshotOf(tables: Seat[][], even: boolean): Snapshot {
  const rows = tables.flatMap((t, ti) =>
    t.map(
      (p, i): SeatRow => ({
        id: p.id,
        table_number: ti + 1,
        seat_order: i,
        name: p.name,
        gender: p.gender,
        is_staff: p.staff,
      }),
    ),
  );
  return { rows: new Map(rows.map((r) => [r.id, r])), tableCount: tables.length, even };
}

const sameRow = (a: SeatRow, b: SeatRow) =>
  a.table_number === b.table_number &&
  a.seat_order === b.seat_order &&
  a.name === b.name &&
  a.gender === b.gender &&
  a.is_staff === b.is_staff;

/** before → after 로 가려면 지울 행, 새로 쓰거나 고칠 행, 설정 변경 여부 */
function diff(before: Snapshot, after: Snapshot) {
  const removed = [...before.rows.keys()].filter((id) => !after.rows.has(id));
  const changed = [...after.rows.values()].filter((r) => {
    const old = before.rows.get(r.id);
    return !old || !sameRow(old, r);
  });
  const settingsChanged = before.tableCount !== after.tableCount || before.even !== after.even;
  return { removed, changed, settingsChanged, empty: !removed.length && !changed.length && !settingsChanged };
}

type Supabase = ReturnType<typeof createClient>;

/**
 * 모임 자리 섞기. 운영진이 함께 쓰는 배치 한 벌을 DB에 둔다
 * (table_shuffle_settings / table_shuffle_seats).
 * 화면을 먼저 바꾸고 잠깐 뒤 바뀐 행만 저장한다 — 뺀 사람은 DB에서도 지운다.
 */
export function TableShuffle() {
  const supabase = useMemo(() => createClient(), []);
  const [initial, setInitial] = useState<{ tables: Seat[][]; even: boolean } | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [settings, seats] = await Promise.all([
        supabase.from("table_shuffle_settings").select("table_count, even_sizes").eq("id", 1).maybeSingle(),
        supabase
          .from("table_shuffle_seats")
          .select("id, table_number, seat_order, name, gender, is_staff")
          .order("table_number")
          .order("seat_order"),
      ]);
      if (cancelled) return;
      if (settings.error || seats.error) {
        setLoadError(true);
        return;
      }
      const rows = (seats.data ?? []) as SeatRow[];
      const count = Math.max(1, settings.data?.table_count ?? 4, ...rows.map((r) => r.table_number));
      const tables: Seat[][] = Array.from({ length: count }, () => []);
      rows.forEach((r) =>
        tables[r.table_number - 1].push({ id: r.id, name: r.name, gender: r.gender, staff: r.is_staff }),
      );
      setInitial({ tables, even: settings.data?.even_sizes ?? true });
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (loadError) {
    return (
      <p className={styles.hint}>
        테이블 섞기 명단을 불러오지 못했습니다. 새로고침해 보고, 계속되면 DB에 테이블 섞기 표
        (table_shuffle_seats)가 만들어졌는지 확인해 주세요.
      </p>
    );
  }
  if (!initial) return <p className={styles.hint}>불러오는 중...</p>;
  return <Shuffler supabase={supabase} initial={initial} />;
}

function Shuffler({ supabase, initial }: { supabase: Supabase; initial: { tables: Seat[][]; even: boolean } }) {
  const [tables, setTables] = useState<Seat[][]>(initial.tables);
  const [even, setEven] = useState(initial.even);
  const [prev, setPrev] = useState<Seat[][] | null>(null);
  const [popped, setPopped] = useState<Set<string>>(new Set());
  const [shaking, setShaking] = useState(false);
  const [status, setStatus] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const pendingFocus = useRef<string | null>(null);

  // DB에 마지막으로 저장된 모습. 저장이 실패하면 그대로 두고 다음 저장 때 다시 비교한다
  const synced = useRef<Snapshot>(snapshotOf(initial.tables, initial.even));
  const latest = useRef({ tables, even });
  const running = useRef(false);
  const again = useRef(false);
  const timer = useRef<number | null>(null);

  const sync = useCallback(async () => {
    // 저장 요청이 겹치지 않게 — 진행 중이면 끝난 뒤 한 번 더 돈다
    if (running.current) {
      again.current = true;
      return;
    }
    running.current = true;
    try {
      do {
        again.current = false;
        const target = snapshotOf(latest.current.tables, latest.current.even);
        const { removed, changed, settingsChanged, empty } = diff(synced.current, target);
        if (empty) break;
        setSaveState("saving");
        const now = new Date().toISOString();
        const results = await Promise.all([
          removed.length ? supabase.from("table_shuffle_seats").delete().in("id", removed) : null,
          changed.length
            ? supabase.from("table_shuffle_seats").upsert(changed.map((r) => ({ ...r, updated_at: now })))
            : null,
          settingsChanged
            ? supabase.from("table_shuffle_settings").upsert({
                id: 1,
                table_count: target.tableCount,
                even_sizes: target.even,
                updated_at: now,
              })
            : null,
        ]);
        if (results.some((r) => r?.error)) {
          setSaveState("error");
          return;
        }
        synced.current = target;
      } while (again.current);
      setSaveState("saved");
    } finally {
      running.current = false;
    }
  }, [supabase]);

  // 바뀔 때마다 잠깐 기다렸다 저장 — 이름을 치는 동안 글자마다 저장하지 않는다
  useEffect(() => {
    latest.current = { tables, even };
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      void sync();
    }, SAVE_DELAY);
  }, [tables, even, sync]);

  // 앱을 내리거나 다른 화면으로 갈 때 남은 변경을 바로 보낸다
  useEffect(() => {
    const flush = () => {
      if (!timer.current) return;
      window.clearTimeout(timer.current);
      timer.current = null;
      void sync();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [sync]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    document.getElementById(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  });

  const everyone = tables.flat();
  const maleTotal = everyone.filter((p) => p.gender === "남").length;
  const staffTotal = everyone.filter((p) => p.staff).length;
  const movable = everyone.length - staffTotal;

  /** 명단을 손대면 되돌리기 기준이 사라진다 */
  function edit(next: Seat[][]) {
    setTables(next);
    setPrev(null);
    setPopped(new Set());
  }

  function updatePerson(id: string, patch: Partial<Seat>) {
    edit(tables.map((t) => t.map((p) => (p.id === id ? { ...p, ...patch } : p))));
  }

  function removePerson(tableIndex: number, id: string) {
    edit(tables.map((t, i) => (i === tableIndex ? t.filter((p) => p.id !== id) : t)));
    pendingFocus.current = `ts-add-${tableIndex}`;
  }

  function addPeople(e: FormEvent<HTMLFormElement>, tableIndex: number) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("names") as HTMLInputElement;
    const names = input.value
      .split(/[,，\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    // 직전 사람과 다른 성별을 기본으로 둔다 — 대부분 번갈아 입력하게 된다
    let last = tables[tableIndex].at(-1)?.gender;
    const added = names.map((name): Seat => {
      const gender: SeatGender = last === "남" ? "여" : "남";
      last = gender;
      return { id: newId(), name: name.slice(0, 40), gender, staff: false };
    });
    edit(tables.map((t, i) => (i === tableIndex ? [...t, ...added] : t)));
    input.value = "";
    pendingFocus.current = `ts-add-${tableIndex}`;
  }

  function changeTableCount(delta: number) {
    if (delta > 0) {
      edit([...tables, []]);
      return;
    }
    if (tables.length <= 1) return;
    const removed = tables.at(-1)!;
    const next = tables.slice(0, -1).map((t) => t.slice());
    // 없어진 테이블 사람은 인원이 적은 테이블로 옮긴다
    removed.forEach((p) => {
      let best = 0;
      next.forEach((t, i) => t.length < next[best].length && (best = i));
      next[best].push(p);
    });
    edit(next);
    if (removed.length) setStatus(`${removed.length}명을 다른 테이블로 옮겼어요.`);
  }

  function runShuffle() {
    const result = shuffleTables(tables, even);
    setPrev(tables);
    setTables(result.tables);
    setPopped(new Set(result.tables.flat().filter((p) => !p.staff).map((p) => p.id)));
    setStatus(`${result.moved}명이 자리를 옮겼어요.`);
  }

  function onShuffle() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      runShuffle();
      return;
    }
    setShaking(true);
    window.setTimeout(() => {
      setShaking(false);
      runShuffle();
    }, 500);
  }

  function undo() {
    if (!prev) return;
    setTables(prev);
    setPrev(null);
    setPopped(new Set());
    setStatus("섞기 전으로 되돌렸어요.");
  }

  function clearAll() {
    if (!window.confirm("모든 테이블의 명단을 DB에서 지울까요? 다른 운영진 화면에서도 사라집니다.")) return;
    setPrev(tables);
    setTables(tables.map(() => []));
    setPopped(new Set());
    setStatus("모든 테이블을 비웠어요.");
  }

  async function copyResult() {
    const text = tables
      .map((t, i) => `${i + 1}번 테이블: ${t.map((p) => p.name + (p.staff ? "(운영진)" : "")).join(", ")}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setStatus("테이블 배치를 복사했어요. 단톡방에 붙여 넣으면 됩니다.");
    } catch {
      window.prompt("아래 내용을 복사해 주세요", text);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <div className={styles.stepper} role="group" aria-label="테이블 개수">
          <span className={styles.stepLabel}>테이블</span>
          <button
            type="button"
            onClick={() => changeTableCount(-1)}
            disabled={tables.length <= 1}
            aria-label="테이블 하나 줄이기"
          >
            −
          </button>
          <output aria-live="polite">{tables.length}</output>
          <button
            type="button"
            onClick={() => changeTableCount(1)}
            disabled={tables.length >= MAX_TABLES}
            aria-label="테이블 하나 늘리기"
          >
            +
          </button>
        </div>

        <div className={styles.stats}>
          <span className={styles.pill}>총 {everyone.length}명</span>
          <span className={styles.pill}>
            <i className={cn(styles.dot, styles.male)} />남 {maleTotal}
          </span>
          <span className={styles.pill}>
            <i className={cn(styles.dot, styles.female)} />여 {everyone.length - maleTotal}
          </span>
          <span className={styles.pill}>
            <i className={cn(styles.dot, styles.staffDot)} />운영진 {staffTotal}
          </span>
        </div>

        <label className={styles.check}>
          <input type="checkbox" checked={even} onChange={(e) => setEven(e.target.checked)} />
          테이블 인원 고르게 맞추기
        </label>

        <span className={toolbar.spacer} />
        <div className={styles.sideActions}>
          <button type="button" className={toolbar.button} onClick={copyResult} disabled={!everyone.length}>
            결과 복사
          </button>
          <button type="button" className={toolbar.button} onClick={clearAll} disabled={!everyone.length}>
            전체 비우기
          </button>
        </div>
      </div>

      <p className={styles.hint}>
        <b>운영진</b>은 지금 테이블에 그대로 앉고, 나머지만 테이블마다 성비가 고르게 섞입니다. 명단은
        운영진이 함께 보며, 고치거나 뺀 내용은 바로 DB에 저장·삭제됩니다.
      </p>

      <div className={cn(styles.grid, shaking && styles.shaking)}>
        {tables.map((table, ti) => (
          <TableCard
            key={ti}
            index={ti}
            table={table}
            popped={popped}
            onUpdate={updatePerson}
            onRemove={(id) => removePerson(ti, id)}
            onAdd={(e) => addPeople(e, ti)}
          />
        ))}
      </div>

      <div className={styles.actionBar}>
        <p className={styles.status} role="status">
          {saveState === "error" ? (
            <>
              <span className={styles.saveError}>DB에 저장하지 못했어요.</span>{" "}
              <button type="button" className={styles.retry} onClick={() => void sync()}>
                다시 저장
              </button>
            </>
          ) : (
            <>
              <span className={styles.saveState}>{saveState === "saving" ? "저장 중" : "저장됨"}</span>
              {status || (movable < 2 ? "운영진이 아닌 사람이 두 명 이상 있어야 섞을 수 있어요." : "")}
            </>
          )}
        </p>
        <button type="button" className={cn(toolbar.button, styles.undo)} onClick={undo} disabled={!prev}>
          되돌리기
        </button>
        <button
          type="button"
          className={cn(toolbar.button, toolbar.primary, styles.go)}
          onClick={onShuffle}
          disabled={movable < 2 || shaking}
        >
          섞기
        </button>
      </div>
    </div>
  );
}

function TableCard({
  index,
  table,
  popped,
  onUpdate,
  onRemove,
  onAdd,
}: {
  index: number;
  table: Seat[];
  popped: Set<string>;
  onUpdate: (id: string, patch: Partial<Seat>) => void;
  onRemove: (id: string) => void;
  onAdd: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const males = table.filter((p) => p.gender === "남").length;
  const shown = Math.max(table.length, 4);
  const size = table.length > 12 ? 36 : table.length > 9 ? 42 : 48;

  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>{index + 1}번 테이블</h3>
        <span className={styles.meta}>
          {table.length}명 / <span className={styles.maleText}>남 {males}</span>{" "}
          <span className={styles.femaleText}>여 {table.length - males}</span>
        </span>
      </div>

      <div
        className={styles.stage}
        role="img"
        aria-label={`${index + 1}번 테이블 자리: ${table.map((p) => p.name).join(", ") || "비어 있음"}`}
      >
        <div className={styles.round}>
          <b>{index + 1}</b>
        </div>
        {Array.from({ length: shown }, (_, i) => {
          const angle = (i / shown) * Math.PI * 2 - Math.PI / 2;
          const p = table[i];
          const style = {
            left: `${50 + Math.cos(angle) * 38}%`,
            top: `${50 + Math.sin(angle) * 38}%`,
            "--sz": `${size}px`,
            "--d": `${(index * 0.05 + i * 0.035).toFixed(2)}s`,
          } as CSSProperties;
          if (!p) {
            return (
              <span key={`empty-${i}`} className={cn(styles.seat, styles.empty)} style={style} aria-hidden>
                빈자리
              </span>
            );
          }
          return (
            <span
              key={p.id}
              className={cn(
                styles.seat,
                p.gender === "남" ? styles.seatMale : styles.seatFemale,
                p.staff && styles.seatStaff,
                popped.has(p.id) && styles.pop,
              )}
              style={style}
              title={p.staff ? `${p.name} (운영진)` : p.name}
            >
              {p.name || "이름?"}
            </span>
          );
        })}
      </div>

      {table.length > 0 ? (
        <ul className={styles.list}>
          {table.map((p) => (
            <li key={p.id} className={styles.row}>
              <input
                id={`ts-name-${p.id}`}
                className={styles.name}
                value={p.name}
                onChange={(e) => onUpdate(p.id, { name: e.target.value })}
                aria-label="이름"
                maxLength={40}
                autoComplete="off"
              />
              <div className={styles.seg} role="group" aria-label={`${p.name} 성별`}>
                {(["남", "여"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={p.gender === g}
                    className={g === "남" ? styles.segMale : styles.segFemale}
                    onClick={() => onUpdate(p.id, { gender: g })}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={styles.staffToggle}
                aria-pressed={p.staff}
                onClick={() => onUpdate(p.id, { staff: !p.staff })}
              >
                운영진
              </button>
              <button
                type="button"
                className={styles.remove}
                onClick={() => onRemove(p.id)}
                aria-label={`${p.name || "이 사람"} 빼기`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.emptyText}>아직 앉은 사람이 없어요.</p>
      )}

      <form className={styles.add} onSubmit={onAdd}>
        <input
          id={`ts-add-${index}`}
          name="names"
          placeholder="이름 입력 (쉼표로 여러 명)"
          aria-label={`${index + 1}번 테이블에 이름 추가`}
          autoComplete="off"
          enterKeyHint="done"
        />
        <button type="submit">추가</button>
      </form>
    </article>
  );
}
