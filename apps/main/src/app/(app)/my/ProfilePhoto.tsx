"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useContentOverride, saveOverride } from "@/lib/content-store";
import { defaultPhotoFocus, type PhotoFocus } from "@/lib/photo-focus";
import { ProfilePhotoEditor } from "./ProfilePhotoEditor";
import styles from "./my.module.css";

interface ProfilePhotoData {
  url: string;
  focus: PhotoFocus;
}

const CONTENT_KEY = "profilePhoto";

/** MY 페이지의 내 프로필 사진. 눌러서 바꾸고, 위치·확대도 조정할 수 있다. */
export function ProfilePhoto({ initial }: { initial: string }) {
  const stored = useContentOverride<ProfilePhotoData | null>(CONTENT_KEY, null);
  const [photo, setPhoto] = useState<ProfilePhotoData | null>(stored);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = photo ?? stored;

  function commit(next: ProfilePhotoData) {
    setPhoto(next);
    saveOverride(CONTENT_KEY, next);
  }

  function onFileChosen(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    commit({ url: URL.createObjectURL(file), focus: defaultPhotoFocus });
  }

  return (
    <div className={styles.avatarWrap}>
      <button
        type="button"
        className={styles.avatar}
        onClick={() => (current ? setEditing(true) : inputRef.current?.click())}
        aria-label={current ? "프로필 사진 위치 조정" : "프로필 사진 등록"}
      >
        {current ? (
          <Image
            className={styles.avatarPhoto}
            src={current.url}
            alt=""
            fill
            sizes="56px"
            unoptimized
            style={{
              objectPosition: `${current.focus.x}% ${current.focus.y}%`,
              transform: `scale(${current.focus.zoom})`,
              transformOrigin: `${current.focus.x}% ${current.focus.y}%`,
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
      >
        ⟳
      </button>

      {editing && current && (
        <ProfilePhotoEditor
          src={current.url}
          focus={current.focus}
          onChange={(focus) => commit({ ...current, focus })}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
