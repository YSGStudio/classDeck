/** 서울 기준 오늘 날짜(YYYY-MM-DD). sv-SE 로케일은 ISO 형식 그대로 반환한다. */
export function todaySeoul(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}
