# Foxity 已知遗留问题清单

> 最后更新：2026-07-05
> 说明：本文档列出在全站排查中**发现的问题**及其修复状态。
> 已修复项标注 ✅ 并保留记录；仍未修复的标注 ⚠️。

---

## 一、问题清单及修复状态

### 1. ✅ [已修复] 删除团队时未清理关联表数据（数据孤儿）
- 位置：`src/app/api/teams/[teamId]/route.ts` 的 `DELETE`
- 修复：DELETE 已在事务中清理 `chat_history` / `dimension_evidence` / `team_members` / `profiles` / `teams` 五张表。

### 2. ✅ [已修复] `hydrate` 会清空整个内存 store
- 位置：`src/store/useStore.ts`
- 修复：已删除无任何调用点的 `hydrate()` 方法及接口定义。

### 3. ✅ [已确认] `mockLeaderSummaries` 残留
- 位置：`src/store/useStore.ts`
- 确认：全局搜索确认 `mockLeaderSummary` / `mockLeaderSummaries` 已不存在。`useStore` 中仅剩 `initialAssessmentState`（评分维度常量），属于合法 UI 常量。

### 4. ✅ [已修复] `createTeam` 与后端 `team_id` 生成契约耦合
- 位置：`src/store/useStore.ts` `createTeam`
- 修复：已加守护 `if (!data?.team_id) throw new Error(...)`，失败时 toast 提示并抛错。

### 5. ✅ [已修复] `joinTeam` 允许调用方伪造 `userId`
- 位置：`src/store/useStore.ts` `joinTeam`
- 修复：`joinTeam` 内先请求 `/api/auth/me`，用 session 真实 `user_id` 覆盖入参。

### 6. ✅ [已修复] 未登录状态下 chat 页的 `guest-<teamId>` 用户切换问题
- 位置：`src/app/chat/[teamId]/page.tsx`
- 修复：用 `prevUserIdRef` 追踪 `effectiveUserId` 变化，user 登录/切号时重置 `messages` / `currentProfile` / `progress` / `highlights` 并重新 `startConversation`。

### 7. ✅ [已修复] 部分 API 返回错误码但前端仅 `console.warn`
- 位置：`useStore` 中 `createTeam` / `joinTeam` / `saveProfile` / `deleteTeam`
- 修复：新增轻量 toast 系统（`src/lib/toast.ts` + `src/components/ui/toaster.tsx`），挂载到全局 layout。关键写操作失败时弹出 toast 提示用户。

---

## 二、未充分验证、建议人工回归的模块

以下模块本轮**没有做深度静态审计**，逻辑上没发现明显问题但也没走完全部路径，建议做一次冒烟测试：

| 模块 | 建议验证点 |
| --- | --- |
| `src/app/api/teams/[teamId]/matrix/route.ts` | 队员访问权限与 leader 一致；成员为 0 时返回结构。 |
| `src/app/api/teams/[teamId]/analysis/route.ts` | 权限校验；AI 调用失败时的降级返回。 |
| `src/app/api/teams/invite/route.ts` | 邀请码生成、过期时间、复用同码。 |
| `src/app/team/[teamId]/join/page.tsx` | 未登录进入是否会先跳登录再回跳；重复加入是否幂等。 |
| `src/app/api/chat-history/*` | 未登录读取的行为；用户 A 是否能读到用户 B 的历史（越权测试）。 |
| `src/app/api/profiles/*` | GET 是否会返回其他用户 profile；PATCH（若有）越权测试。 |
| `src/lib/session.ts` / `src/lib/auth-server.ts` | Cookie 有效期、SameSite、跨域；`requireUser` 未登录抛错路径。 |
| `src/lib/db.ts` | Turso 连接断线后的重试；`initDb` 是否幂等（多次冷启是否安全）。 |
| PDF 导出 | 中文字体是否嵌入完整；长内容分页。 |

---

## 三、建议接下来做的事

1. **补一份最小冒烟脚本**（e2e or 手测清单），覆盖：注册 → 建队 → 生成邀请 → 另一账号加入 → 双方各自测评 → 队长看板 → 删除团队。这套跑通即视为"无功能缺陷"。
2. 完成第二节中各模块的人工回归测试。
