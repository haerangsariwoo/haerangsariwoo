import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { homeCopy, memberFaqs, noticeCopies } from "@/lib/app-content";
import { albums } from "@/lib/community";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";
import styles from "./content.module.css";

export const metadata = { title: "콘텐츠 관리 · 해랑사리우" };

export default function AdminContentPage() {
  return (
    <>
      <Panel title="홈 화면 문구" desc="부원이 앱을 열었을 때 가장 먼저 보는 인사말입니다.">
        <div className={styles.fieldList}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="greeting">
              인사말 뒤 문구
              <span className={styles.hint}>예: 홍근<b>님!</b></span>
            </label>
            <input id="greeting" className={styles.input} defaultValue={homeCopy.greetingSuffix} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="sub">
              안내 한 줄
            </label>
            <input id="sub" className={styles.input} defaultValue={homeCopy.subGreeting} />
          </div>
        </div>

        <div className={styles.saveBar}>
          <p className={styles.saveNote}>저장하면 부원 홈 화면에 즉시 반영됩니다.</p>
          <button type="button" className={cn(toolbar.button, toolbar.primary)}>
            저장
          </button>
        </div>
      </Panel>

      <Panel
        title="자주 묻는 질문 (Q&A)"
        count={`${memberFaqs.length}개`}
        desc="부원이 자주 묻는 내용을 정리합니다. 마이페이지와 쪽지함에서 확인할 수 있어요."
      >
        <div className={styles.itemList}>
          {memberFaqs.map((f, i) => (
            <div key={f.id} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.itemNo}>{i + 1}</span>
                <span className={styles.itemTitle}>질문 {i + 1}</span>
                <button type="button" className={styles.iconBtn}>
                  ↑
                </button>
                <button type="button" className={styles.iconBtn}>
                  ↓
                </button>
                <button type="button" className={cn(styles.iconBtn, styles.danger)}>
                  삭제
                </button>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${f.id}-q`}>
                  질문
                </label>
                <input id={`${f.id}-q`} className={styles.input} defaultValue={f.q} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${f.id}-a`}>
                  답변
                </label>
                <textarea id={`${f.id}-a`} className={styles.textarea} defaultValue={f.a} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.addRow}>
          <button type="button" className={toolbar.button}>
            ＋ 질문 추가
          </button>
        </div>

        <div className={styles.saveBar}>
          <p className={styles.saveNote}>순서를 바꾸면 앱에도 같은 순서로 표시됩니다.</p>
          <button type="button" className={cn(toolbar.button, toolbar.primary)}>
            저장
          </button>
        </div>
      </Panel>

      <Panel
        title="화면 안내 문구"
        count={`${noticeCopies.length}개`}
        desc="각 화면 하단에 표시되는 안내입니다. 운영 방식이 바뀌면 함께 수정해 주세요."
      >
        <div className={styles.itemList}>
          {noticeCopies.map((n) => (
            <div key={n.id} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.screenTag}>{n.screen}</span>
                <span className={styles.itemTitle}>화면 하단 안내</span>
              </div>
              <textarea className={styles.textarea} defaultValue={n.text} />
            </div>
          ))}
        </div>

        <div className={styles.saveBar}>
          <p className={styles.saveNote}>저장하면 해당 화면에 즉시 반영됩니다.</p>
          <button type="button" className={cn(toolbar.button, toolbar.primary)}>
            저장
          </button>
        </div>
      </Panel>

      <Panel
        title="활동 사진 (앨범)"
        count={`${albums.length}개`}
        desc="커뮤니티 앨범과 홈 화면에 노출되는 사진입니다. 상세 관리는 활동앨범 메뉴에서 할 수 있어요."
      >
        <div className={styles.itemList}>
          {albums.map((a) => (
            <div key={a.id} className={styles.albumRow}>
              <input
                className={styles.albumTitle}
                defaultValue={a.title}
                aria-label={`${a.title} 앨범 이름`}
              />
              <span className={styles.albumMeta}>
                <span className={styles.albumDate}>{a.date}</span>
                <span className={styles.albumCount}>등록된 사진 {a.photoCount}장</span>
              </span>
              <button type="button" className={styles.albumUpload}>
                사진 업로드
              </button>
            </div>
          ))}
        </div>

        <div className={styles.saveBar}>
          <p className={styles.saveNote}>새 앨범은 활동앨범 메뉴에서 만들 수 있습니다.</p>
          <button type="button" className={cn(toolbar.button, toolbar.primary)}>
            저장
          </button>
        </div>
      </Panel>
    </>
  );
}
