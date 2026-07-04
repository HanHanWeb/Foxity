export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initDb } = await import("@/lib/db");
    try {
      await initDb();
      console.log("[db] schema initialized");
    } catch (e) {
      console.error("[db] init error:", e);
    }
  }
}
