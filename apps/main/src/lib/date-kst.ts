/**
 * 날짜를 한국 시각으로 적는다 — "2026.09.13".
 *
 * 서버는 UTC 로 돈다. getDate() 를 그냥 쓰면 아침 9시 전에 올린 글이 전날로
 * 찍힌다. 보는 사람도 쓰는 사람도 한국에 있으므로 여기서 못박는다.
 */
export function formatDateKST(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}
