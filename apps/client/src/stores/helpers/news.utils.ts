export function normalizeNewsItems(items: string[]) {
  return [...items]
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .reverse();
}
