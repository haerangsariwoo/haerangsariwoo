"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { createClient } from "@/lib/supabase/client";
import { storagePath } from "@/lib/storage-name";
import { compressImage, FileTooLargeError, PROOF_PRESET } from "@/lib/image-compress";
import type { ProofSubmission, VerifySource } from "@/lib/verify";
import styles from "./verify.module.css";

const STEPS = ["증빙 제출", "운영진 검토", "시간 반영"];

interface PhotoFile {
  file: File;
  previewUrl: string;
}

export default function VerifyPage() {
  const supabase = useMemo(() => createClient(), []);
  const [source, setSource] = useState<VerifySource>("1365");
  const [title, setTitle] = useState("");
  const [org, setOrg] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [memo, setMemo] = useState("");
  /** 1365·VMS 봉사시간 인증서 캡처 한 장 */
  const [photo, setPhoto] = useState<PhotoFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<ProofSubmission[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  async function loadHistory() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("proof_submissions")
      .select("*")
      .eq("member_id", user.id)
      .order("created_at", { ascending: false });
    setHistory((data ?? []) as ProofSubmission[]);
    setLoadingHistory(false);
  }

  useEffect(() => {
    queueMicrotask(loadHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 고른 즉시 줄여 둔다 — 미리보기도 줄인 그림으로 보여야 실제 올라갈 것과 같다 */
  async function pickPhoto(files: FileList | null) {
    const chosen = files?.[0];
    if (!chosen) return;
    setError(null);

    try {
      const small = await compressImage(chosen, PROOF_PRESET);
      setPhoto((prev) => {
        if (prev) URL.revokeObjectURL(prev.previewUrl);
        return { file: small, previewUrl: URL.createObjectURL(small) };
      });
    } catch (e) {
      setError(
        e instanceof FileTooLargeError ? e.message : "사진을 읽지 못했어요. 다른 사진을 골라주세요.",
      );
    }
  }

  function removePhoto() {
    setPhoto((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }

  const canSubmit = title.trim() && date.trim() && Number(hours) > 0 && photo && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      setError("로그인이 필요합니다.");
      return;
    }

    const path = storagePath(user.id, photo.file.name);
    const { error: uploadError } = await supabase.storage
      .from("proof-files")
      .upload(path, photo.file);
    if (uploadError) {
      setSubmitting(false);
      setError("사진 업로드 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    const { error: insertError } = await supabase.from("proof_submissions").insert({
      member_id: user.id,
      source,
      activity_title: title.trim(),
      activity_org: org.trim(),
      activity_date: date,
      hours: Number(hours),
      photo_paths: [path],
      memo: memo.trim(),
    });

    setSubmitting(false);
    if (insertError) {
      setError("제출 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    setSubmitted(true);
    loadHistory();
  }

  /** 아직 검토 전인 내 제출만 취소할 수 있다 — 운영진이 본 뒤에는 못 지운다 */
  async function cancelSubmission(item: ProofSubmission) {
    if (!window.confirm(`"${item.activity_title}" 제출을 취소할까요? 올린 사진도 함께 지워집니다.`))
      return;

    const prev = history;
    setHistory((cur) => cur.filter((r) => r.id !== item.id));

    if (item.photo_paths.length > 0) {
      await supabase.storage.from("proof-files").remove(item.photo_paths);
    }
    const { error: deleteError } = await supabase
      .from("proof_submissions")
      .delete()
      .eq("id", item.id);
    if (deleteError) {
      setHistory(prev);
      setError("취소하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  function resetForm() {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    setSubmitted(false);
    setSource("1365");
    setTitle("");
    setOrg("");
    setDate("");
    setHours("");
    setMemo("");
    setPhoto(null);
  }

  return (
    <div className={styles.page}>
      <PageHeader title="봉사 인증" back={{ href: "/home", label: "홈" }} />

      <div className={styles.steps}>
        {STEPS.map((label, i) => (
          <div key={label} className={styles.step}>
            {i < STEPS.length - 1 && <span className={styles.stepLine} />}
            <span className={styles.stepDot}>{i + 1}</span>
            <span className={styles.stepLabel}>{label}</span>
          </div>
        ))}
      </div>

      {submitted ? (
        <div className={styles.card}>
          <p className={styles.cardTitle}>증빙을 제출했어요</p>
          <p className={styles.done}>
            운영진이 검토한 뒤 봉사시간을 반영합니다.
            <br />
            결과는 아래 제출 내역에서 확인할 수 있어요.
          </p>
          <button type="button" className={styles.submit} onClick={resetForm}>
            다른 봉사 인증하기
          </button>
        </div>
      ) : (
        <form className={styles.card} onSubmit={handleSubmit}>
          <p className={styles.cardTitle}>증빙 제출</p>
          <p className={styles.hint}>
            1365 · VMS 에서 신청·참여한 봉사만 해당돼요. 우리 동아리가 직접 여는 내부봉사는 증빙이
            필요 없어요.
          </p>

          <div className={styles.field}>
            <span className={styles.label}>출처</span>
            <div className={styles.genderRow} role="group" aria-label="출처 선택">
              {(["1365", "vms"] as VerifySource[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={source === s}
                  className={cn(styles.sourceBtn, source === s && styles.on)}
                  onClick={() => setSource(s)}
                >
                  {s === "1365" ? "1365" : "VMS"}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="verify-title">
              봉사명
            </label>
            <input
              id="verify-title"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 무료급식 배식 봉사"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="verify-org">
              기관 (선택)
            </label>
            <input
              id="verify-org"
              className={styles.input}
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="예: 성북종합사회복지관"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="verify-date">
              활동일
            </label>
            <input
              id="verify-date"
              className={styles.input}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="verify-hours">
              신청 인정시간
            </label>
            <input
              id="verify-hours"
              className={styles.input}
              type="number"
              min={1}
              max={24}
              inputMode="numeric"
              placeholder="예: 3"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <p className={styles.hint}>실제 활동한 시간을 입력해 주세요. 운영진 확인 후 반영됩니다.</p>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>봉사시간 인증서</span>
            {photo ? (
              <div className={styles.photoGrid}>
                <div className={styles.photoThumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.previewUrl} alt="" />
                  <button
                    type="button"
                    className={styles.photoRemove}
                    onClick={removePhoto}
                    aria-label="사진 다시 고르기"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : (
              <label className={styles.upload}>
                <span className={styles.uploadIcon}>＋</span>
                인증서 캡처 올리기
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    pickPhoto(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            <p className={styles.hint}>
              1365 · VMS 에서 <b>봉사시간이 인증된 화면</b>을 캡처해 한 장 올려주세요.
              활동명과 시간이 보이면 됩니다.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="verify-memo">
              메모 (선택)
            </label>
            <textarea
              id="verify-memo"
              className={styles.textarea}
              placeholder="운영진에게 전할 내용이 있다면 적어주세요."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button type="submit" className={styles.submit} disabled={!canSubmit}>
            {submitting ? "제출 중..." : "인증 신청하기"}
          </button>
        </form>
      )}

      <section>
        <h2 className={styles.groupTitle}>제출 내역</h2>
        <div className={styles.list}>
          {loadingHistory && <p className={styles.hint}>불러오는 중...</p>}
          {!loadingHistory && history.length === 0 && (
            <p className={styles.hint}>아직 제출한 증빙이 없어요.</p>
          )}
          {history.map((r) => (
            <div key={r.id} className={styles.item}>
              <div className={styles.itemHead}>
                <div className={styles.itemBody}>
                  <p className={styles.itemTitle}>{r.activity_title}</p>
                  <p className={styles.itemMeta}>
                    {r.activity_date} · {r.hours}시간 · 사진 {r.photo_paths.length}장
                  </p>
                </div>
                <span className={cn(styles.state, styles[r.status])}>{r.status}</span>
              </div>
              {r.reject_reason && <p className={styles.reason}>반려 사유 · {r.reject_reason}</p>}
              {r.status === "대기" && (
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => cancelSubmission(r)}
                >
                  제출 취소
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
