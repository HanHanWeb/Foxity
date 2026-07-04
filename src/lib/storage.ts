const PREFIX = "fox_senior_";

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export function removeStorage(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${PREFIX}${key}`);
}

// 按用户 ID 存储对话记录
export function saveChatHistory(userId: string, messages: any[]) {
  writeStorage(`chat_history_${userId}`, messages);
}

export function getChatHistory(userId: string): any[] {
  return readStorage(`chat_history_${userId}`, []);
}
