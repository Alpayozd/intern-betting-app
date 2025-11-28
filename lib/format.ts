/**
 * Formatér et tal med dansk locale for konsistent formatering
 * mellem server og client
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("da-DK")
}

