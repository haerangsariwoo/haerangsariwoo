import { cn } from "@/lib/cn";
import { Panel } from "@/components/admin/Panel/Panel";
import { Badge, DataTable, RowAction, tableStyles } from "@/components/admin/DataTable/DataTable";
import { adminMembers } from "@/lib/admin-data";
import toolbar from "@/components/admin/Toolbar/Toolbar.module.css";

export const metadata = { title: "회원·기수·권한 · 해랑사리우" };

export default function AdminMembersPage() {
  return (
    <Panel
      title="회원 관리"
      count={`${adminMembers.length}명`}
      desc="회원 등록 시 학번과 식별번호를 발급합니다. 식별번호는 로그인에 사용됩니다."
    >
      <div className={toolbar.toolbar}>
        <input className={toolbar.search} placeholder="이름·학번 검색" aria-label="회원 검색" />
        <select className={toolbar.select} defaultValue="all" aria-label="기수 필터">
          <option value="all">기수: 전체</option>
          <option value="59">59기</option>
          <option value="58">58기</option>
        </select>
        <select className={toolbar.select} defaultValue="all" aria-label="권한 필터">
          <option value="all">권한: 전체</option>
          <option value="member">부원</option>
          <option value="admin">운영진</option>
        </select>
        <span className={toolbar.spacer} />
        <button type="button" className={cn(toolbar.button, toolbar.primary)}>
          ＋ 회원 등록
        </button>
      </div>

      <DataTable columns={["이름", "학번", "기수", "학부·트랙", "권한", "누적시간", "식별번호", ""]}>
        {adminMembers.map((m) => (
          <tr key={m.id}>
            <td>{m.name}</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>{m.studentId}</td>
            <td className={tableStyles.muted}>{m.cohort}</td>
            <td className={tableStyles.muted}>{m.track}</td>
            <td>
              <Badge tone={m.role === "운영진" ? "purple" : "grey"}>{m.role}</Badge>
            </td>
            <td className={tableStyles.numeric}>{m.hours}시간</td>
            <td className={cn(tableStyles.muted, tableStyles.numeric)}>••••••</td>
            <td>
              <RowAction>수정</RowAction>
            </td>
          </tr>
        ))}
      </DataTable>
    </Panel>
  );
}
