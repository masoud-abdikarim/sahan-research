type RateLimitInfo = {
  count: number;
  lockUntil: number | null;
};

// Global cache for IP rate limiting
const ipCache = new Map<string, RateLimitInfo>();

export function checkIpRateLimit(ip: string): { locked: boolean; waitMs?: number; lockUntil?: string } {
  const now = Date.now();
  const info = ipCache.get(ip) || { count: 0, lockUntil: null };

  if (info.lockUntil && now < info.lockUntil) {
    return { locked: true, waitMs: info.lockUntil - now, lockUntil: new Date(info.lockUntil).toISOString() };
  }

  // Reset lock if expired
  if (info.lockUntil && now >= info.lockUntil) {
    info.count = 0;
    info.lockUntil = null;
  }

  info.count += 1;

  // IP rate limiting: max 10 failed requests per minute from same IP
  if (info.count > 10) {
    info.lockUntil = now + 5 * 60 * 1000; // 5 minutes lock
    ipCache.set(ip, info);
    return { locked: true, waitMs: 5 * 60 * 1000, lockUntil: new Date(info.lockUntil).toISOString() };
  }

  ipCache.set(ip, info);

  // Clear IP count after 2 minutes if not locked
  setTimeout(() => {
    const currentInfo = ipCache.get(ip);
    if (currentInfo && !currentInfo.lockUntil) {
      currentInfo.count = Math.max(0, currentInfo.count - 1);
      if (currentInfo.count === 0) ipCache.delete(ip);
    }
  }, 120000);

  return { locked: false };
}

export function resetIpRateLimit(ip: string) {
  ipCache.delete(ip);
}
