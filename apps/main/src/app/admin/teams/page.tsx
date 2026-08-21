import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { teamPool } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./teams.module.css";

export const metadata = { title: "팀짜기 · 해랑사리우" };

export default function AdminTeamsPage() {
  const assigned = teamPool.filter((m) => m.team !== null);
  const unassigned = teamPool.filter((m) => m.team === null);

  const teams = [...new Set(assigned.map((m) => m.team))].sort((a, b) => (a ?? 0) - (b ?? 0));

  return (
    <>
      <Panel
        title="팀짜기"
        desc="행사 참여 인원을 선택하면 성비를 맞춰 조를 편성합니다. 편성 후 운영진이 직접 조정할 수 있습니다."
      >
        <div className={toolbar.toolbar}>
          <select className={toolbar.select} defaultValue="a2" aria-label="행사 선택">
            <option value="a2">제26회 해랑사리우 MT</option>
            <option value="a3">2학기 개강파티</option>
            <option value="a1">2학기 정기총회</option>
          </select>
          <select className={toolbar.select} defaultValue="6" aria-label="조당 인원">
            <option value="4">조당 4명</option>
            <option value="5">조당 5명</option>
            <option value="6">조당 6명</option>
          </select>
          <span className={toolbar.spacer} />
          <button type="button" className={toolbar.button}>
            참여 인원 선택
          </button>
          <button type="button" className={cn(toolbar.button, toolbar.primary)}>
            성비 균등 자동 편성
          </button>
        </div>

        <div className={styles.layout}>
          <div>
            <h3 className={styles.teamName} style={{ marginBottom: 12 }}>
              미배정 {unassigned.length}명
            </h3>
            <div className={styles.poolList}>
              {unassigned.map((m) => (
                <div key={m.id} className={styles.poolRow}>
                  <span className={styles.poolAvatar}>{m.name.charAt(0)}</span>
                  <div>
                    <p className={styles.poolName}>{m.name}</p>
                    <p className={styles.poolMeta}>{m.cohort}</p>
                  </div>
                  <span className={cn(styles.genderTag, styles[m.gender])}>{m.gender}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className={styles.teamName} style={{ marginBottom: 12 }}>
              편성된 조 {teams.length}개
            </h3>
            <div className={styles.teamGrid}>
              {teams.map((t) => {
                const members = assigned.filter((m) => m.team === t);
                const male = members.filter((m) => m.gender === "남").length;
                const female = members.length - male;
                return (
                  <div key={t} className={styles.teamCard}>
                    <div className={styles.teamHead}>
                      <span className={styles.teamName}>MT {t}조</span>
                      <span className={styles.ratio}>
                        남 {male} · 여 {female}
                      </span>
                    </div>
                    <div className={styles.chipRow}>
                      {members.map((m) => (
                        <span key={m.id} className={styles.memberChip}>
                          <span className={cn(styles.dot, styles[m.gender])} />
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.publishBar}>
          <p className={styles.publishText}>
            발행하면 부원이 <b>홈 · 내 조</b>에서 결과를 확인할 수 있습니다. (조회 전용)
          </p>
          <button type="button" className={toolbar.button}>
            임시 저장
          </button>
          <button type="button" className={cn(toolbar.button, toolbar.primary)}>
            조 편성 발행
          </button>
        </div>
      </Panel>
    </>
  );
}
