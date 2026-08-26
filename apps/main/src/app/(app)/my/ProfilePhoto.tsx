"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { storagePath } from "@/lib/storage-name";
import { defaultPhotoFocus, type PhotoFocus } from "@/lib/photo-focus";
import { ProfilePhotoEditor } from "./ProfilePhotoEditor";
import styles from "./my.module.css";

const BUCKET = "profile-photos";

interface Props {
  initial: string;
  /** 서버에서 만들어 준 지금 사진 주소 (없으면 이름 첫 글자를 보여준다) */
  photoUrl: string | null;
  focus: PhotoFocus;
}

/**
 * MY 페이지의 내 프로필 사진. 눌러서 바꾸고, 위치·확대도 조정할 수 있다.
 * 사진은 실제로 스토리지에 올라가고 경로는 members 에 남는다 — 예전에는
 * 브라우저 blob 주소만 저장해서 새로고침하면 깨졌다.
 */
export function ProfilePhoto({ initial, photoUrl, focus: initialFocus }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [url, setUrl] = useState<string | null>(photoUrl);
  const [focus, setFocus] = useState<PhotoFocus>(initialFocus);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFileChosen(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("로그인이 필요해요.");
      return;
    }

    const path = storagePath(user.id, file.name);
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
    if (uploadError) {
      setBusy(false);
      setError("사진을 올리지 못했어요.");
      return;
    }

    const { data: prev } = await supabase
      .from("members")
      .select("photo_path")
      .eq("id", user.id)
      .single();

    const { error: saveError } = await supabase
      .from("members")
      .update({ photo_path: path, photo_focus: defaultPhotoFocus })
      .eq("id", user.id);

    if (saveError) {
      await supabase.storage.from(BUCKET).remove([path]);
      setBusy(false);
      setError("사진을 저장하지 못했어요.");
      return;
    }

    // 예전 사진은 이제 아무도 안 쓰므로 정리한다
    const oldPath = (prev as { photo_path: string | null } | null)?.photo_path;
    if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);

    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    setUrl(signed?.signedUrl ?? null);
    setFocus(defaultPhotoFocus);
    setBusy(false);
  }

  async function saveFocus(next: PhotoFocus) {
    setFocus(next);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("members").update({ photo_focus: next }).eq("id", user.id);
  }

  return (
    <div className={styles.avatarWrap}>
      <button
        type="button"
        className={styles.avatar}
        onClick={() => (url ? setEditing(true) : inputRef.current?.click())}
        aria-label={url ? "프로필 사진 위치 조정" : "프로필 사진 등록"}
        disabled={busy}
      >
        {url ? (
          <Image
            className={styles.avatarPhoto}
            src={url}
            alt=""
            fill
            sizes="56px"
            unoptimized
            style={{
              objectPosition: `${focus.x}% ${focus.y}%`,
              transform: `scale(${focus.zoom})`,
              transformOrigin: `${focus.x}% ${focus.y}%`,
            }}
          />
        ) : (
          initial
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onFileChosen(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        className={styles.avatarEdit}
        onClick={() => inputRef.current?.click()}
        aria-label="프로필 사진 변경"
        disabled={busy}
      >
        {busy ? "…" : "⟳"}
      </button>

      {error && <span className={styles.avatarError}>{error}</span>}

      {editing && url && (
        <ProfilePhotoEditor
          src={url}
          focus={focus}
          onChange={saveFocus}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
