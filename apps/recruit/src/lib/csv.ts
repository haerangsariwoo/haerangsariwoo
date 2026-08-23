"use client";

/**
 * 표 데이터를 CSV 파일로 내려받는다.
 * 서버 없이 브라우저에서 만들어 저장하므로 Supabase 연동 전에도 실제로 동작한다.
 */
/** 엑셀이 UTF-8 로 읽도록 붙이는 표식 */
const BOM = "﻿";

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    // 쉼표·따옴표·줄바꿈이 있으면 따옴표로 감싸고 내부 따옴표는 두 번 쓴다
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const body = [header, ...rows].map((r) => r.map(escape).join(",")).join("\r\n");
  // 엑셀이 한글을 깨뜨리지 않도록 BOM 을 붙인다
  const blob = new Blob([BOM + body], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 파일명에 붙일 오늘 날짜 (20260824) */
export function today() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
