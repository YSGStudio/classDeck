const KEY = "classdeck:pendingAchievementStandard";

/** Stashes an achievement standard picked on /standards so /lessons/new can pick it up. */
export function stashPendingAchievementStandard(text: string): void {
  sessionStorage.setItem(KEY, text);
}

/** Reads the stashed standard without clearing it. Safe to call repeatedly (e.g. from
 * an effect that React may invoke twice in development under Strict Mode). */
export function peekPendingAchievementStandard(): string | null {
  return sessionStorage.getItem(KEY);
}

/** Clears the stash once it's actually been attached to a lesson, so it never leaks
 * into a later, unrelated lesson creation. */
export function clearPendingAchievementStandard(): void {
  sessionStorage.removeItem(KEY);
}
