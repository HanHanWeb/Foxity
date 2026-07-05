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

// 期望的表结构定义（用于校验已存在的表是否匹配）
const EXPECTED_COLUMNS: Record<string, string[]> = {
  teams: ["team_id", "team_name", "competition_type", "organizer_name", "owner_user_id", "created_at"],
  profiles: ["user_id", "user_name", "team_id", "timestamp", "data", "verified_scores", "self_scores", "evidence_levels", "twelve_type", "credibility"],
  chat_history: ["id", "user_id", "team_id", "role", "content", "emotion", "created_at"],
  dimension_evidence: ["id", "user_id", "team_id", "dimension", "evidence_level", "quality_score", "summary", "quote", "chat_round", "created_at"],
  users: ["user_id", "display_name", "password_hash", "email", "created_at"],
  sessions: ["token", "user_id", "expires_at", "created_at"],
};

// 校验已存在的表是否拥有期望的列；不匹配则 DROP 重建
async function ensureTableSchema(db: Client, table: string, createSql: string) {
  try {
    const res = await db.execute(`PRAGMA table_info(${table})`);
    const rows = res.rows as unknown as { name: string }[];
    // 表不存在（rows 为空），交给 CREATE TABLE IF NOT EXISTS 处理
    if (rows.length === 0) return;
    const expected = EXPECTED_COLUMNS[table] || [];
    const actual = rows.map((r) => r.name);
    const mismatch = expected.some((col) => !actual.includes(col));
    if (mismatch) {
      console.warn(`[db] 表 ${table} 结构不匹配，期望列 [${expected.join(", ")}]，实际列 [${actual.join(", ")}]，正在重建...`);
      await db.execute(`DROP TABLE IF EXISTS ${table}`);
      await db.execute(createSql);
      console.log(`[db] 表 ${table} 已重建`);
    }
  } catch (e: any) {
    // 表不存在等错误，忽略，交给 CREATE TABLE IF NOT EXISTS 处理
    if (!/no such table/i.test(e?.message || "")) {
      console.warn(`[db] 校验 ${table} 结构时出错:`, e?.message);
    }
  }
}

const CREATE_TEAMS = `CREATE TABLE IF NOT EXISTS teams (
  team_id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL,
  competition_type TEXT NOT NULL DEFAULT '默认',
  organizer_name TEXT NOT NULL DEFAULT '',
  owner_user_id TEXT,
  created_at TEXT NOT NULL
)`;

const CREATE_PROFILES = `CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  team_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  data TEXT NOT NULL,
  verified_scores TEXT,
  self_scores TEXT,
  evidence_levels TEXT,
  twelve_type TEXT,
  credibility TEXT,
  FOREIGN KEY (team_id) REFERENCES teams(team_id)
)`;

const CREATE_CHAT_HISTORY = `CREATE TABLE IF NOT EXISTS chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  emotion TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES profiles(user_id)
)`;

// V3 新增：维度证据表（每轮对话产生的证据记录）
const CREATE_DIMENSION_EVIDENCE = `CREATE TABLE IF NOT EXISTS dimension_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  dimension TEXT NOT NULL,
  evidence_level TEXT NOT NULL,
  quality_score REAL NOT NULL,
  summary TEXT,
  quote TEXT,
  chat_round INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES profiles(user_id)
)`;

const CREATE_USERS = `CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
)`;

const CREATE_SESSIONS = `CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
)`;

// 建表（幂等执行，应用启动时调用一次即可）
export async function initDb() {
  const db = getDb();

  // 先校验已存在的表结构是否匹配，不匹配则重建
  await ensureTableSchema(db, "teams", CREATE_TEAMS);
  await ensureTableSchema(db, "profiles", CREATE_PROFILES);
  await ensureTableSchema(db, "chat_history", CREATE_CHAT_HISTORY);
  await ensureTableSchema(db, "dimension_evidence", CREATE_DIMENSION_EVIDENCE);
  await ensureTableSchema(db, "users", CREATE_USERS);
  await ensureTableSchema(db, "sessions", CREATE_SESSIONS);

  // 建表（IF NOT EXISTS 保证幂等）
  await db.executeMultiple(`
    ${CREATE_TEAMS};
    ${CREATE_PROFILES};
    ${CREATE_CHAT_HISTORY};
    ${CREATE_DIMENSION_EVIDENCE};
    ${CREATE_USERS};
    ${CREATE_SESSIONS};
    CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team_id);
    CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_team ON chat_history(team_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_user ON dimension_evidence(user_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_team ON dimension_evidence(team_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_dimension ON dimension_evidence(dimension);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);

  // 迁移：为已存在的 users 表补齐 email 列
  try {
    await db.execute(`ALTER TABLE users ADD COLUMN email TEXT`);
    console.log("[db] users.email column added");
  } catch (e: any) {
    if (!/duplicate column/i.test(e?.message || "")) {
      console.warn("[db] users.email migration skipped:", e?.message);
    }
  }

  // 迁移：为已存在的 teams 表补齐 owner_user_id 列
  try {
    await db.execute(`ALTER TABLE teams ADD COLUMN owner_user_id TEXT`);
    console.log("[db] teams.owner_user_id column added");
  } catch (e: any) {
    if (!/duplicate column/i.test(e?.message || "")) {
      console.warn("[db] teams.owner_user_id migration skipped:", e?.message);
    }
  }

  // V3 迁移：profiles 表新增评分相关列
  const v3Columns = ["verified_scores", "self_scores", "evidence_levels", "twelve_type", "credibility"];
  for (const col of v3Columns) {
    try {
      await db.execute(`ALTER TABLE profiles ADD COLUMN ${col} TEXT`);
      console.log(`[db] profiles.${col} column added`);
    } catch (e: any) {
      if (!/duplicate column/i.test(e?.message || "")) {
        console.warn(`[db] profiles.${col} migration skipped:`, e?.message);
      }
    }
  }
}

// ===== V3 新增：证据操作工具函数 =====

// 保存单条证据
export async function saveEvidence(
  db: Client,
  evidence: {
    user_id: string;
    team_id: string;
    dimension: string;
    evidence_level: string;
    quality_score: number;
    summary: string;
    quote: string;
    chat_round: number;
  },
) {
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO dimension_evidence (user_id, team_id, dimension, evidence_level, quality_score, summary, quote, chat_round, created_at)
          VALUES (:user_id, :team_id, :dimension, :evidence_level, :quality_score, :summary, :quote, :chat_round, :created_at)`,
    args: {
      user_id: evidence.user_id,
      team_id: evidence.team_id,
      dimension: evidence.dimension,
      evidence_level: evidence.evidence_level,
      quality_score: evidence.quality_score,
      summary: evidence.summary,
      quote: evidence.quote,
      chat_round: evidence.chat_round,
      created_at: now,
    },
  });
}

// 批量保存证据
export async function saveEvidencesBatch(
  db: Client,
  evidences: Array<{
    user_id: string;
    team_id: string;
    dimension: string;
    evidence_level: string;
    quality_score: number;
    summary: string;
    quote: string;
    chat_round: number;
  }>,
) {
  if (evidences.length === 0) return;
  const now = new Date().toISOString();
  for (const e of evidences) {
    await db.execute({
      sql: `INSERT INTO dimension_evidence (user_id, team_id, dimension, evidence_level, quality_score, summary, quote, chat_round, created_at)
            VALUES (:user_id, :team_id, :dimension, :evidence_level, :quality_score, :summary, :quote, :chat_round, :created_at)`,
      args: {
        user_id: e.user_id,
        team_id: e.team_id,
        dimension: e.dimension,
        evidence_level: e.evidence_level,
        quality_score: e.quality_score,
        summary: e.summary,
        quote: e.quote,
        chat_round: e.chat_round,
        created_at: now,
      },
    });
  }
}

// 查询用户所有证据
export async function getUserEvidences(db: Client, user_id: string, team_id: string) {
  const res = await db.execute({
    sql: `SELECT * FROM dimension_evidence WHERE user_id = :user_id AND team_id = :team_id ORDER BY chat_round ASC`,
    args: { user_id, team_id },
  });
  return res.rows;
}

// 查询用户某维度的证据
export async function getUserDimensionEvidences(
  db: Client,
  user_id: string,
  team_id: string,
  dimension: string,
) {
  const res = await db.execute({
    sql: `SELECT * FROM dimension_evidence WHERE user_id = :user_id AND team_id = :team_id AND dimension = :dimension ORDER BY chat_round ASC`,
    args: { user_id, team_id, dimension },
  });
  return res.rows;
}

// 更新用户画像的评分数据（V3新增字段）
export async function updateProfileScores(
  db: Client,
  user_id: string,
  team_id: string,
  scores: {
    verified_scores: string;  // JSON string
    self_scores: string;      // JSON string
    evidence_levels: string;  // JSON string
    twelve_type: string;      // JSON string
    credibility: string;      // JSON string
  },
) {
  await db.execute({
    sql: `UPDATE profiles 
          SET verified_scores = :verified_scores,
              self_scores = :self_scores,
              evidence_levels = :evidence_levels,
              twelve_type = :twelve_type,
              credibility = :credibility
          WHERE user_id = :user_id AND team_id = :team_id`,
    args: {
      user_id,
      team_id,
      verified_scores: scores.verified_scores,
      self_scores: scores.self_scores,
      evidence_levels: scores.evidence_levels,
      twelve_type: scores.twelve_type,
      credibility: scores.credibility,
    },
  });
}
