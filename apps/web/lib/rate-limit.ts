const windows = new Map<string, { count: number; resetAt: number }>();

export const assertRateLimit = (key: string, limit: number, windowMs: number): void => {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new Error("請稍後再試。");
  }

  current.count += 1;
};
