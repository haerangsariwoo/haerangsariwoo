"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button/Button";
import { TextField } from "@/components/ui/TextField/TextField";
import { createClient } from "@/lib/supabase/client";
import { isValidPassword } from "@/lib/signup";
import styles from "./account.module.css";

export function AccountForm({ track: initialTrack }: { track: string }) {
  const [track, setTrack] = useState(initialTrack);
  const [trackSaving, setTrackSaving] = useState(false);
  const [trackDone, setTrackDone] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  async function saveTrack(e: FormEvent) {
    e.preventDefault();
    if (!track.trim()) return;
    setTrackSaving(true);
    setTrackError(null);
    setTrackDone(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setTrackSaving(false);
      setTrackError("로그인이 필요합니다.");
      return;
    }
    const { error } = await supabase.from("members").update({ track: track.trim() }).eq("id", user.id);
    setTrackSaving(false);
    if (error) {
      setTrackError("변경 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }
    setTrackDone(true);
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = "현재 비밀번호를 입력해 주세요.";
    if (!isValidPassword(newPassword)) next.newPassword = "새 비밀번호는 6자 이상이어야 합니다.";
    else if (newPassword !== newPasswordConfirm) next.newPasswordConfirm = "비밀번호가 일치하지 않습니다.";

    setPwErrors(next);
    setPwDone(false);
    if (Object.keys(next).length > 0) return;

    setPwSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setPwSaving(false);
      setPwErrors({ currentPassword: "로그인이 필요합니다." });
      return;
    }

    // 비밀번호를 바꾸기 전에 현재 비밀번호가 맞는지 다시 확인한다.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) {
      setPwSaving(false);
      setPwErrors({ currentPassword: "현재 비밀번호가 올바르지 않습니다." });
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (updateError) {
      setPwErrors({ newPassword: "변경 중 문제가 발생했습니다. 다시 시도해 주세요." });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setPwDone(true);
  }

  return (
    <div className={styles.groups}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>트랙 (학과)</h2>
        <form className={styles.form} onSubmit={saveTrack}>
          <TextField
            label="트랙"
            name="track"
            value={track}
            onChange={(e) => {
              setTrack(e.target.value);
              setTrackDone(false);
            }}
            errorText={trackError ?? undefined}
            helperText={trackDone ? "저장됐습니다." : undefined}
          />
          <Button type="submit" variant="navy" size="md" disabled={trackSaving}>
            {trackSaving ? "저장 중..." : "저장"}
          </Button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>비밀번호 변경</h2>
        <form className={styles.form} onSubmit={changePassword}>
          <TextField
            label="현재 비밀번호"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            errorText={pwErrors.currentPassword}
          />
          <TextField
            label="새 비밀번호"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="6자 이상"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            errorText={pwErrors.newPassword}
          />
          <TextField
            label="새 비밀번호 확인"
            name="newPasswordConfirm"
            type="password"
            autoComplete="new-password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            errorText={pwErrors.newPasswordConfirm}
            helperText={pwDone ? "비밀번호가 변경됐습니다." : undefined}
          />
          <Button type="submit" variant="navy" size="md" disabled={pwSaving}>
            {pwSaving ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </form>
      </section>
    </div>
  );
}
