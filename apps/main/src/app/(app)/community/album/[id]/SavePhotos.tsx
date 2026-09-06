"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { type Album } from "@/lib/community";
import { displayFileName } from "@/lib/storage-name";
import { makeZip, uniqueNames } from "@/lib/zip";
import styles from "./album.module.css";

/**
 * 폰에서 사진을 "사진 앱" 에 넣는 길은 공유창뿐이다. 그냥 내려받으면
 * 아이폰은 파일 앱에, 안드로이드는 다운로드 폴더에 들어간다. ZIP 이면
 * 갤러리에는 아예 안 뜬다. 그래서 공유창을 쓸 수 있으면 그쪽을 쓰고,
 * 공유창이 없는 PC 에서만 ZIP 으로 내려준다.
 */
function canShareFiles(files: File[]) {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files })
  );
}

/** 사용자가 공유창을 그냥 닫은 것 — 실패로 볼 일이 아니다 */
function isCancel(e: unknown) {
  return e instanceof DOMException && e.name === "AbortError";
}

function photoName(path: string | undefined, index: number) {
  return path ? displayFileName(path) : `사진 ${index + 1}.jpg`;
}

async function toFile(url: string, name: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("photo fetch failed");
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

async function saveZip(files: File[], albumTitle: string) {
  const entries = await Promise.all(
    files.map(async (f) => ({ name: f.name, data: new Uint8Array(await f.arrayBuffer()) })),
  );

  const url = URL.createObjectURL(makeZip(entries));
  const a = document.createElement("a");
  a.href = url;
  // 파일 이름에 못 쓰는 글자를 덜어낸다
  a.download = `${albumTitle.replace(/[\\/:*?"<>|]/g, "").trim() || "앨범"} 사진.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 저장이 시작될 틈을 준 뒤 정리한다
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

type SaveState =
  | { phase: "idle" }
  | { phase: "loading"; done: number; total: number }
  | { phase: "ready"; files: File[] };

/**
 * 게시글의 사진을 한 번에 받는다.
 *
 * 제목 옆에 두는 단추다 — 사진을 다 넘겨 보고 맨 아래까지 내려가야
 * 저장할 수 있으면 있는 줄도 모른다.
 */
export function SavePhotos({ album }: { album: Album }) {
  const count = album.photos.length;
  const [save, setSave] = useState<SaveState>({ phase: "idle" });
  const [error, setError] = useState<string | null>(null);

  /**
   * 폰은 "누른 직후" 에만 공유창을 열어준다. 사진을 다 받고 나서 열려고 하면
   * 시간이 지났다며 막는다. 그래서 받기와 저장을 두 번의 누름으로 나눴다.
   */
  async function onSave() {
    if (save.phase === "loading") return;
    setError(null);

    if (save.phase === "ready") {
      try {
        await navigator.share({ files: save.files });
      } catch (e) {
        if (isCancel(e)) return;
        // 사진이 많으면 공유창이 거절하기도 한다 — 그때는 묶어서 내려준다
        await saveZip(save.files, album.title);
      }
      setSave({ phase: "idle" });
      return;
    }

    setSave({ phase: "loading", done: 0, total: count });
    try {
      const names = uniqueNames(album.photos.map((p, i) => photoName(p.path, i)));
      const files: File[] = [];
      // 한 장씩 차례로 받는다. 한꺼번에 받으면 폰에서 메모리가 튄다
      for (let i = 0; i < album.photos.length; i++) {
        files.push(await toFile(album.photos[i].fullUrl, names[i]));
        setSave({ phase: "loading", done: i + 1, total: count });
      }

      if (canShareFiles(files)) {
        setSave({ phase: "ready", files });
      } else {
        await saveZip(files, album.title);
        setSave({ phase: "idle" });
      }
    } catch {
      setError("사진을 모두 받지 못했어요. 잠시 후 다시 시도해 주세요.");
      setSave({ phase: "idle" });
    }
  }

  if (count === 0) return null;

  const label =
    save.phase === "loading"
      ? `${save.done}/${save.total}`
      : save.phase === "ready"
        ? "사진 앱에 저장"
        : count > 1
          ? `${count}장 저장`
          : "사진 저장";

  return (
    <>
      <button
        type="button"
        className={cn(styles.saveAll, save.phase === "ready" && styles.saveReady)}
        onClick={onSave}
        disabled={save.phase === "loading"}
      >
        {label}
      </button>
      {save.phase === "ready" && (
        <span className={styles.hint}>한 번 더 누르면 사진 앱에 저장할 수 있어요.</span>
      )}
      {error && <span className={styles.saveError}>{error}</span>}
    </>
  );
}
