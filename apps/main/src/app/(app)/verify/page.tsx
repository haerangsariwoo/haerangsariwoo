"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { verifiableActivities, verifyRequests } from "@/lib/verify";
import styles from "./verify.module.css";

const STEPS = ["증빙 제출", "운영진 검토", "시간 반영"];

export default function VerifyPage() {
  const [activityId, setActivityId] = useState("");
  const [hours, setHours] = useState("");
  const [memo, setMemo] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const selected = useMemo(
    () => verifiableActivities.find((a) => a.id === activityId),
    [activityId],
  );

  function chooseActivity(id: string) {
    setActivityId(id);
    const found = verifiableActivities.find((a) => a.id === id);
    setHours(found ? String(found.hours) : "");
  }

  const canSubmit = Boolean(activityId) && Boolean(hours) && files.length > 0;

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
            결과는 쪽지함으로 알려드려요.
          </p>
          <button
            type="button"
            className={styles.submit}
            onClick={() => {
              setSubmitted(false);
              setActivityId("");
              setHours("");
              setMemo("");
              setFiles([]);
            }}
          >
            다른 봉사 인증하기
          </button>
        </div>
      ) : (
        <form
          className={styles.card}
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <p className={styles.cardTitle}>증빙 제출</p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="verify-activity">
              참여한 봉사
            </label>
            <select
              id="verify-activity"
              className={styles.select}
              value={activityId}
              onChange={(e) => chooseActivity(e.target.value)}
            >
              <option value="">봉사를 선택해 주세요</option>
              {verifiableActivities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} · {a.date}
                </option>
              ))}
            </select>
            {selected && <p className={styles.hint}>활동일 {selected.date}</p>}
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
            <p className={styles.hint}>실제 활동한 시간을 입력해 주세요. 운영진이 확인 후 조정할 수 있어요.</p>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>증빙 사진</span>
            <label className={styles.upload}>
              <span className={styles.uploadIcon}>＋</span>
              사진 첨부하기
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) =>
                  setFiles(Array.from(e.target.files ?? []).map((f) => f.name))
                }
              />
            </label>
            {files.length > 0 && (
              <div className={styles.fileList}>
                {files.map((name) => (
                  <span key={name} className={styles.fileChip}>
                    {name}
                  </span>
                ))}
              </div>
            )}
            <p className={styles.hint}>활동 모습이나 확인서가 보이는 사진을 올려주세요. (최대 5장)</p>
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

          <button type="submit" className={styles.submit} disabled={!canSubmit}>
            인증 신청하기
          </button>
        </form>
      )}

      <section>
        <h2 className={styles.groupTitle}>제출 내역</h2>
        <div className={styles.list}>
          {verifyRequests.map((r) => (
            <div key={r.id} className={styles.item}>
              <div className={styles.itemHead}>
                <div className={styles.itemBody}>
                  <p className={styles.itemTitle}>{r.volunteer}</p>
                  <p className={styles.itemMeta}>
                    {r.date} · {r.hours}시간 · 증빙 {r.proofCount}장
                  </p>
                </div>
                <span className={cn(styles.state, styles[r.state])}>{r.state}</span>
              </div>
              {r.reason && <p className={styles.reason}>반려 사유 · {r.reason}</p>}
            </div>
          ))}
        </div>
      </section>

      <p className={styles.note}>
        승인된 실적만 MY 페이지 봉사시간에 반영됩니다.
        <br />
        1365 · VMS 봉사는 각 사이트 실적과 별도로 동아리 시간에 합산돼요.
      </p>
    </div>
  );
}
