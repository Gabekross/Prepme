export function nextLetterId(existingIds: string[]) {
  const used = new Set(existingIds.map((s) => s.toLowerCase()));
  for (let i = 0; i < 26; i++) {
    const id = String.fromCharCode("a".charCodeAt(0) + i);
    if (!used.has(id)) return id;
  }
  // fallback if someone adds too many
  return `opt_${existingIds.length + 1}`;
}

export function safeParse<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export function pretty(obj: any) {
  return JSON.stringify(obj, null, 2);
}
