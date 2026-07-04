import { createClient, type Client } from "@libsql/client";

const TURSO_URL = process.env.TURSO_DATABASE_URL || "libsql://hks-hanhanweb.aws-ap-south-1.turso.io";
const TURSO_TOKEN =
  process.env.TURSO_AUTH_TOKEN ||
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODMxNjQ1OTcsImlkIjoiMDE5ZjJiN2ItM2MwMS03NzkxLTkxMzctY2M5YzVkMDc5ZGNjIiwia2lkIjoiOUZYOXBHdFlhcjA1ZHRldXBVb0NxWmhIdG40VXBGRGFzRS1YNjJXZ0xHcyIsInJpZCI6Ijg2N2FjODdjLTYzNmItNGUxNC1hZjQ5LWNmZDQ2MjRiZmU1YiJ9.WgqJLYmUNhUN93aXBO9o4ACn78PIgtwC125wsE9AZq6SZERK_WZzBdfqibP3kQr2n2qOYhiWcwQEDqVX-_FlBA";

let _client: Client | null = null;

export function getDb(): Client {
  if (!_client) {
    _client = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
  }
  return _client;
}

// 建表（幂等执行，应用启动时调用一次即可）
export async function initDb() {
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS teams (
      team_id TEXT PRIMARY KEY,
      team_name TEXT NOT NULL,
      competition_type TEXT NOT NULL DEFAULT '默认',
      organizer_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      team_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      data TEXT NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(team_id)
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      emotion TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES profiles(user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team_id);
    CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_team ON chat_history(team_id);
  `);
}
