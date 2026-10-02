import type { KeyResult, Assessment } from "./types";
export function progress(
  kr: Pick<KeyResult, "baseline" | "target" | "current">,
): number | null {
  if (
    kr.current === null ||
    !Number.isFinite(kr.current) ||
    kr.target === kr.baseline
  )
    return null;
  return Math.max(
    0,
    Math.min(
      100,
      (100 * (kr.current - kr.baseline)) / (kr.target - kr.baseline),
    ),
  );
}
export function objectiveProgress(krs: KeyResult[]): number | null {
  const measured = krs.map(progress).filter((v): v is number => v !== null);
  return measured.length
    ? measured.reduce((a, b) => a + b, 0) / measured.length
    : null;
}
export function gap(a: Assessment): number | null {
  return a.current === null ? null : Math.max(0, a.target - a.current);
}
