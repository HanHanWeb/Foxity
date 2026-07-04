# Codex Prompt：团队能力测评产品前端完整实现

> 将以下完整prompt复制给Codex，可直接生成可运行的前端项目。

---

## 给Codex的完整Prompt

```
你是一个资深前端工程师。请用Next.js 14 + TypeScript + Tailwind CSS + Framer Motion构建一个完整的「团队能力测评产品」，产品名叫「狐狸学长」。

这是一个帮助比赛团队评估成员能力、生成个人画像和团队看板的AI测评工具。用户和一个卡通狐狸形象对话20分钟，狐狸学长会自适应地问问题，最后生成个人能力定位卡。组织者可以查看全队的能力矩阵和分工建议。

请严格按照以下设计规范实现所有页面和功能。

═══════════════════════════════════════════════════════
技术栈
═══════════════════════════════════════════════════════

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion（动画）
- Lucide React（图标）
- Recharts（雷达图/柱状图）
- 状态管理：Zustand
- 本地存储：localStorage（MVP阶段不接后端，用mock数据 + localStorage模拟）
- Lottie React（狐狸动画，先用SVG占位，预留Lottie接口）

═══════════════════════════════════════════════════════
全局设计规范
═══════════════════════════════════════════════════════

配色系统（Tailwind自定义颜色）：
--fox-orange: #FF9F4D      （主色，狐狸橙）
--fox-orange-light: #FFB87A
--fox-orange-dark: #E88830
--fox-cream: #FFF8F0       （背景奶白）
--fox-navy: #2B4C7E        （围巾藏青，专业感锚点）
--fox-navy-light: #3D6298
--fox-mint: #6BCB9F        （成功/正确反馈）
--fox-coral: #FF6B6B       （警告/错误）
--fox-yellow: #FFD93D      （高亮/星星）
--fox-gray: #8B8B8B        （次要文字）
--fox-gray-light: #E5E5E5  （边框/分割线）
--fox-gray-bg: #F7F7F7     （卡片背景）

字体：
- 标题：Noto Sans SC, font-weight 700
- 正文：Noto Sans SC, font-weight 400
- 数字：Noto Sans SC, font-weight 600（tabular-nums）

圆角：
- 按钮：rounded-xl（12px）
- 卡片：rounded-2xl（16px）
- 头像：rounded-full
- 输入框：rounded-xl

阴影：
- 卡片：shadow-sm + border border-fox-gray-light
- 悬浮卡片：shadow-lg
- 按钮：shadow-sm

动画原则：
- 页面切换：slide + fade，duration 300ms
- 卡片出现：fade + slide-up，duration 400ms，stagger 50ms
- 按钮hover：scale 1.02，duration 150ms
- 狐狸表情切换：crossfade，duration 300ms
- 评分条填充：width动画，duration 800ms，ease-out
- 雷达图出现：scale 0→1，duration 600ms，spring

═══════════════════════════════════════════════════════
页面结构（App Router路由）
═══════════════════════════════════════════════════════

/                    → 落地页
/team/create         → 组织者创建团队
/team/[teamId]       → 团队看板（组织者视角）
/team/[teamId]/join  → 队员加入团队
/chat/[teamId]       → 对话测评页（核心页面）
/profile/[userId]    → 个人画像页
/profile/[userId]/feedback → 画像反馈页

布局组件：
- RootLayout：全局字体、背景色、Zustand provider
- 落地页、创建团队页、加入页：全屏布局，无导航栏
- 对话页：全屏沉浸式布局，无导航栏
- 画像页、团队看板：带顶部导航栏的布局

═══════════════════════════════════════════════════════
页面1：落地页 /
═══════════════════════════════════════════════════════

布局：全屏，左右分栏（桌面端），上下排列（移动端）

左侧（60%宽度）：
- 顶部Logo：狐狸SVG头像（48x48）+ "狐狸学长"文字
- 主标题（text-5xl font-bold text-fox-navy）："找到你在团队中的最佳位置"
- 副标题（text-lg text-fox-gray）："和AI学长聊20分钟，发现你没意识到的能力盲区"
- 两个CTA按钮，纵向排列，间距gap-3：
  1. 主按钮："我是组织者，创建团队" → 跳转 /team/create
     样式：bg-fox-navy text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-fox-navy-light
  2. 次按钮："我有邀请码，加入团队" → 弹出输入框，输入团队码后跳转 /team/[teamId]/join
     样式：border-2 border-fox-navy text-fox-navy px-8 py-4 rounded-xl text-lg font-semibold hover:bg-fox-navy hover:text-white
- 底部三个特性卡片，横向排列（gap-4），每个卡片包含图标+标题+描述：
  1. 🎯 "自适应测评" - "AI根据你的回答动态调整问题，不走固定流程"
  2. 📊 "三层画像" - "技能层→行为模式层→自我认知层，越聊越深"
  3. 🦊 "狐狸学长" - "可爱但专业，会挑战你，不只迎合你"

右侧（40%宽度）：
- 大尺寸狐狸SVG（占满高度），用一个放松坐姿的狐狸，戴藏青色围巾
- 狐狸周围浮动3-4个气泡，展示产品关键词："市场分析 8/10 ✅"、"压力反应：行动型"、"AI发现：你有产品思维潜力"
- 气泡用Framer Motion做缓慢上下浮动动画（y: 0→-10→0，duration 3s，repeat Infinity）

移动端：左侧内容在上，狐狸在下，特性卡片改为纵向排列。

═══════════════════════════════════════════════════════
页面2：创建团队页 /team/create
═══════════════════════════════════════════════════════

布局：居中卡片布局，max-w-lg，顶部有返回按钮

卡片内容：
1. 标题："创建团队"（text-3xl font-bold text-fox-navy）
2. 副标题："填写团队信息，生成邀请链接"（text-sm text-fox-gray）

3. 表单字段（纵向排列，gap-4）：
   - 团队名称（input，placeholder："例：挑战杯-智慧农业项目组"）
   - 比赛类型（select：挑战杯 / 互联网+ / 创青春 / 其他）
   - 你的名字（input，placeholder："组织者姓名"）
   - 你的角色（select：队长 / 队员）

4. 提交按钮："生成邀请链接"
   样式：w-full bg-fox-orange text-white py-3 rounded-xl font-semibold hover:bg-fox-orange-dark

提交后：
- 生成一个6位团队码（如：FOX3A7）
- 生成邀请链接（如：/team/FOX3A7/join）
- 卡片切换为"邀请链接生成成功"状态：
  - 显示团队码（大字号，居中，text-4xl font-bold text-fox-navy，可点击复制）
  - 显示邀请链接（可点击复制）
  - "复制链接"按钮
  - "开始我的测评"按钮 → 跳转 /chat/FOX3A7
  - "查看团队看板"按钮 → 跳转 /team/FOX3A7
  - 底部小字："把链接发给队友，他们完成测评后你就能看到全队能力矩阵"

═══════════════════════════════════════════════════════
页面3：加入团队页 /team/[teamId]/join
═══════════════════════════════════════════════════════

布局：居中卡片，max-w-md

卡片内容：
1. 狐狸SVG头像（64x64，居中）
2. 标题："欢迎加入团队！"（text-2xl font-bold text-center）
3. 团队信息展示："团队：[团队名] · [比赛类型]"（text-sm text-fox-gray text-center）
4. 名字输入框（input，placeholder："你的名字"）
5. 两个按钮（纵向排列）：
   - "开始测评" → 跳转 /chat/[teamId]?user=[名字]
     样式：w-full bg-fox-orange text-white py-3 rounded-xl font-semibold
   - "稍后再测" → 跳回落地页

═══════════════════════════════════════════════════════
页面4：对话测评页 /chat/[teamId] ★核心页面★
═══════════════════════════════════════════════════════

这是最核心的页面，需要最精细的设计。

布局：全屏，三栏布局（桌面端），单栏（移动端）

### 左栏（25%宽度，min-w-240px）：对话信息面板

顶部：
- 返回按钮（← 图标，点击弹出确认对话框"测评还没完成，确定要退出吗？"）
- 团队名称（text-sm text-fox-gray）

中间 - 测评进度面板：
- 标题"测评进度"（text-xs font-semibold text-fox-gray uppercase tracking-wider）
- 5个组别的进度指示器，纵向排列（gap-2）：
  每个组别一行：
  - 组别图标+名称（如"📊 背景市场"）
  - 状态标签（3种状态）：
    - 未涉及：灰色小圆点 + "未测"（text-fox-gray text-xs）
    - 测评中：橙色脉冲圆点 + "进行中"（text-fox-orange text-xs）+ Framer Motion脉冲动画
    - 已完成：绿色✓ + "已完成"（text-fox-mint text-xs）
- 这部分是动态的，根据对话内容实时更新（从AI回复中解析关键词来判断覆盖了哪些组别）

底部 - 时间提示：
- 一个小卡片，显示：
  - "⏱️ 已用 [X] 分钟"（实时计时器，从对话开始算起）
  - 预估剩余时间（基于进度计算，粗略提示）
  - text-xs text-fox-gray

底部 - 关键事件指示：
- 两个小标签：
  - "压力事件" - 未触发时灰色，触发后变绿色✓
  - "冲突事件" - 未触发时灰色，触发后变绿色✓
- 让用户知道测评在推进

### 中栏（50%宽度）：对话区域

顶部栏（h-14，border-b）：
- 左侧：狐狸小头像（32x32）+ "狐狸学长" + 在线状态绿点
- 右侧："重置对话"按钮（text-xs，点击弹出确认）

对话区域（flex-1，overflow-y-auto，p-6）：
- 消息列表，从下往上滚动
- AI消息样式：
  - 头像在左（狐狸32x32圆角）
  - 消息气泡：bg-white border border-fox-gray-light rounded-2xl rounded-tl-sm p-4 max-w-[80%]
  - 文字：text-sm text-gray-800
  - 如果AI消息中包含文件上传请求，消息气泡下方显示一个虚线框上传区域：
    "📎 把文件拖到这里，或点击上传"
    样式：border-2 border-dashed border-fox-gray-light rounded-xl p-4 text-center text-xs text-fox-gray
    支持点击上传和拖拽上传
- 用户消息样式：
  - 消息气泡靠右：bg-fox-navy text-white rounded-2xl rounded-tr-sm p-4 max-w-[80%] ml-auto
  - 文字：text-sm
- 用户上传文件后显示文件卡片：
  - 文件图标 + 文件名 + 文件大小
  - 样式：bg-fox-gray-bg rounded-lg p-3

底部输入区（border-t，p-4）：
- 文本输入框（textarea，auto-resize，max-h-32）
  - placeholder："输入你的回答..."
  - 样式：w-full border border-fox-gray-light rounded-xl px-4 py-3 resize-none focus:border-fox-orange focus:ring-1 focus:ring-fox-orange outline-none
- 底部操作栏（flex justify-between items-center mt-2）：
  - 左侧：文件上传按钮（📎图标 + "上传作品"文字，text-sm text-fox-gray）
  - 右侧：发送按钮（纸飞机图标，bg-fox-orange text-white rounded-lg px-4 py-2）
  - 回车发送，Shift+回车换行
- AI正在输入时，显示三个跳动的点（typing indicator），在AI消息位置

### 右栏（25%宽度，min-w-240px）：狐狸形象区

这是狐狸学长的展示区域，是对话中"被看见"感的视觉锚点。

顶部 - 狐狸大头像区域（占右栏60%高度）：
- 居中显示一个大尺寸的狐狸SVG（200x200）
- 狐狸有8种表情状态，根据AI消息末尾的[expression:xxx] tag切换
- 表情切换用Framer Motion做crossfade动画
- 狐狸有呼吸动画（scale: 1→1.02→1，duration 3s，repeat Infinity）
- 狐狸有随机眨眼动画（每5-8秒眨一次）
- 背景有一个柔和的圆形渐变光晕（radial-gradient，fox-orange-light到透明）

8种表情状态的视觉变化（用SVG的path/属性变化实现）：
- smile（默认）：眼睛弯弯（^^），嘴角上扬
- thinking：一只手托腮（可以用一个小圆点在脸旁），眼睛看上方
- curious：眼睛变大变圆，有星星高光，耳朵竖起来
- challenge：一侧眉毛挑起，嘴角微歪
- nod：眼睛弯弯（^^），嘴角上扬，头部微下点
- surprised：眼睛圆睁，嘴巴变成小O
- encourage：温柔微笑，眼睛半弯
- serious：眼睛正视，嘴巴一条直线，围巾更明显

中间 - 当前状态文字（h-12）：
- 在狐狸头像下方，显示一行状态文字
- 根据表情状态显示不同文字：
  - smile: "认真倾听中..."
  - thinking: "让我想想..."
  - curious: "诶？这个有意思！"
  - challenge: "嗯...我有不同看法"
  - nod: "说得对！"
  - surprised: "哦？没想到！"
  - encourage: "没关系，慢慢来"
  - serious: "认真总结中..."
- 样式：text-sm text-fox-gray text-center

底部 - 实时洞察卡片区域：
- 标题"实时洞察"（text-xs font-semibold text-fox-gray uppercase tracking-wider）
- 这里会随着对话推进，逐渐显示AI在对话中产生的判断片段
- 每个洞察是一个小卡片：
  - bg-fox-cream border border-fox-gray-light rounded-lg p-3
  - 图标 + 一行文字（如"📊 检测到市场分析能力，正在深挖..."）
  - 出现动画：fade + slide-right，duration 400ms
- 洞察示例：
  - "📊 市场分析：PEST框架使用规范 ✓"
  - "💡 发现：你描述数据时有产品思维"
  - "⚡ 压力反应：行动型（先自己扛）"
  - "🎯 建议深挖：产品方向"
- 这些洞察卡片从AI的回复中提取（关键词匹配），让用户感觉到AI在"思考"他

移动端适配：
- 左栏隐藏，通过顶部下拉菜单访问进度
- 右栏变成顶部一个小狐狸头像（48x48）+ 状态文字
- 对话区域占满屏幕

═══════════════════════════════════════════════════════
页面5：个人画像页 /profile/[userId] ★核心页面★
═══════════════════════════════════════════════════════

布局：顶部导航栏 + 内容区（max-w-4xl mx-auto，p-6）

顶部导航栏（h-16，border-b，sticky top-0，bg-white/80 backdrop-blur）：
- 左侧：狐狸Logo + "狐狸学长"
- 中间：Tab切换（个人画像 | 团队看板）—— 如果用户属于某个团队
- 右侧：用户名 + 头像

内容区结构：

### Section 1：核心定位卡片
- 全宽大卡片，bg-gradient-to-br from-fox-cream to-white，border border-fox-gray-light，rounded-2xl，p-8
- 居中显示：
  - 狐狸头像（64x64）
  - "你的核心定位"（text-xs text-fox-gray uppercase tracking-wider）
  - 核心定位文字（text-3xl font-bold text-fox-navy），如"能用数据说话的市场分析手"
  - 角色标签（3个，flex gap-2 justify-center mt-3）：
    每个标签：bg-fox-orange/10 text-fox-orange px-3 py-1 rounded-full text-sm font-medium

### Section 2：能力雷达图 + 分数详情
左右布局（桌面端），上下排列（移动端）

左侧（50%）：
- 用Recharts画一个雷达图（RadarChart）
- 5个维度：背景市场、产品、技术、财务、美工
- 数据：用户的5个能力分数
- 配色：填充用fox-orange半透明，边框用fox-orange
- 验证状态用不同颜色：已验证=fox-orange实心，待验证=fox-orange半透明，未涉及=灰色
- 图表标题"能力分布"在上方
- 鼠标hover显示tooltip（维度名+分数+验证状态）

右侧（50%）：
- 5个能力条，纵向排列（gap-4）
- 每个能力条一行：
  - 上方：图标+组名（左）+ 分数（右，如"8/10"）
  - 下方：进度条（h-2 rounded-full bg-fox-gray-bg）
    - 填充色：已验证=fox-orange，待验证=fox-orange-light，未涉及=fox-gray
    - 填充宽度动画：从0动画到目标百分比，duration 800ms
  - 验证状态标签（在分数右侧）：
    - ✅已验证：bg-fox-mint/10 text-fox-mint text-xs px-2 py-0.5 rounded
    - ⚠️待验证：bg-fox-yellow/10 text-fox-yellow text-xs px-2 py-0.5 rounded
    - ❓未涉及：bg-fox-gray/10 text-fox-gray text-xs px-2 py-0.5 rounded
- 底部两个小标签：
  - "建议主攻：[组别]" bg-fox-navy text-white text-sm px-3 py-1 rounded
  - "建议参与：[组别]" border border-fox-navy text-fox-navy text-sm px-3 py-1 rounded

### Section 3：Top3优势
- 标题"核心优势"（text-xl font-bold text-fox-navy mb-4）
- 3个优势卡片，纵向排列（gap-3）
- 每个卡片：bg-white border border-fox-gray-light rounded-xl p-4
  - 左侧序号圆圈（bg-fox-orange text-white w-8 h-8 rounded-full flex items-center justify-center font-bold）
  - 右侧内容：
    - 优势标题（font-semibold text-gray-800）
    - 证据文字（text-sm text-fox-gray mt-1，前面带"证据："标签）
  - 卡片出现动画：fade + slide-up，stagger 100ms

### Section 4：行为模式卡
- 标题"你怎么做事"（text-xl font-bold text-fox-navy mb-4），旁边小字"基于对话推断，仅供参考"
- 3个行为模式卡片，横向排列（桌面端gap-4），纵向（移动端）

卡片1 - 压力反应（bg-fox-cream rounded-xl p-5）：
- 图标：🔥
- 标题"压力反应"（font-semibold text-fox-navy）
- 内容行：
  - "压力源：[内容]"
  - "第一反应：[类型]"（用彩色标签：行动型=fox-orange，情绪型=fox-coral，求助型=fox-mint，回避型=fox-gray）
  - "恢复速度：[快/中/慢]"
  - "盲区：[内容]"

卡片2 - 冲突处理（bg-fox-cream rounded-xl p-5）：
- 图标：🤝
- 标题"冲突处理"
- 内容行：
  - "面对分歧：[类型]"（协商型/回避型/对抗型/妥协型，同上彩色标签）
  - "触发点：[内容]"
  - "优势：[内容]"

卡片3 - 协作风格（bg-fox-cream rounded-xl p-5）：
- 图标：💬
- 标题"协作风格"
- 内容行：
  - "沟通方式：[类型]"
  - "决策偏好：[类型]"
  - "角色倾向：[排序]"

### Section 5：自我认知校准
- 标题"你不了解自己的什么"（text-xl font-bold text-fox-navy mb-4）
- 整体评价卡片（bg-gradient-to-r from-fox-navy to-fox-navy-light text-white rounded-xl p-6）：
  - "你对自己的评价：[准确/偏高/偏低]"（text-lg font-semibold）
- 偏差列表（如果有偏差项）：
  - 每个偏差一个卡片（bg-white border border-fox-gray-light rounded-xl p-4）
  - 左侧：维度名 + 自评分 vs 实测分（用两个小进度条对比）
    - 自评分条：灰色
    - 实测分条：fox-orange
    - 两者并排或上下对比
  - 右侧：偏差说明 + 建议（text-sm）
  - 如果是"低估"：显示"⬆️ 这可能是你没意识到的优势"
  - 如果是"高估"：显示"⬇️ 建议做决定前找反馈验证"

### Section 6：AI主动发现
- 标题"AI发现的"（text-xl font-bold text-fox-navy mb-4），旁边有一个✨图标
- 每个发现一个卡片（bg-fox-orange/5 border border-fox-orange/20 rounded-xl p-4）
  - ✨图标 + 发现内容
  - 卡片出现动画：fade + scale，stagger 150ms
- 这部分是产品的"惊喜时刻"，视觉上要有仪式感

### Section 7：团队定位
- 标题"团队定位"（text-xl font-bold text-fox-navy mb-4）
- 两列布局：
  - 左列"最佳搭档"：
    - 绿色背景卡片（bg-fox-mint/10 rounded-xl p-5）
    - "✅ 适合搭配"列表，每项一行
    - "❌ 尽量避免"列表，每项一行（bg-fox-coral/10）
  - 右列"诚实声明"：
    - 卡片（bg-fox-gray-bg rounded-xl p-5）
    - ⚠️图标 + "以下维度需要实际合作才能判断"
    - 三个未测维度列表
    - 底部小字："建议组织者在第一周安排小任务观察"

### 底部：反馈区
- 居中卡片（max-w-md mx-auto text-center py-8）
- "你觉得准吗？"（text-lg font-semibold text-fox-navy）
- 三个大按钮（横向排列，gap-3）：
  - "很准" → bg-fox-mint text-white
  - "基本准" → bg-fox-yellow text-white
  - "不太准" → bg-fox-coral text-white
- 点击后展开文本框："说说哪里不准？" + 提交按钮
- 提交后显示："谢谢反馈！这能帮狐狸学长变得更准。" + "返回首页"按钮

═══════════════════════════════════════════════════════
页面6：团队看板页 /team/[teamId] ★核心页面★
═══════════════════════════════════════════════════════

布局：顶部导航栏 + 内容区（max-w-6xl mx-auto，p-6）

顶部：
- 团队名称 + 比赛类型（text-sm text-fox-gray）
- 团队码（可点击复制）
- "邀请更多队员"按钮（border border-fox-navy text-fox-navy px-4 py-2 rounded-lg）

### Section 1：团队能力矩阵（表格）

- 标题"团队能力矩阵"（text-xl font-bold text-fox-navy mb-4）
- 表格样式（用div模拟table，不用原生table标签）：
  - 表头行（bg-fox-navy text-white text-sm font-semibold）：
    | 队员 | 📊背景市场 | 🎯产品 | 💻技术 | 💰财务 | 🎨美工 |
  - 每个队员一行（hover:bg-fox-cream）：
    | 队员名 | 分数+状态 | 分数+状态 | ... |
  - 分数显示格式：数字 + 验证状态图标（✅/⚠️/❓）
  - 已验证分数：text-fox-navy font-bold
  - 待验证分数：text-fox-gray
  - 未涉及：text-fox-gray-light，显示"—"
  - 底部汇总行（bg-fox-gray-bg font-semibold）：
    | 团队均分 | 均分 | 均分 | ... |
    | 覆盖情况 | ✅/⚠️ | ✅/⚠️ | ... |

- 表格右上角有一个"能力热力图"切换按钮，点击后表格切换成热力图模式：
  - 每个格子用颜色深浅表示分数（0-3浅色，4-6中色，7-10深色）
  - 颜色从fox-cream到fox-orange-dark渐变

### Section 2：团队协作风格图谱

- 标题"协作风格图谱"（text-xl font-bold text-fox-navy mb-4）
- 表格样式：
  - 表头：| 队员 | 压力反应 | 冲突处理 | 协作风格 | 沟通方式 |
  - 每个队员一行
  - 每个风格维度用彩色标签：
    - 压力反应：行动型=橙，情绪型=红，求助型=绿，回避型=灰
    - 冲突处理：协商型=绿，回避型=灰，对抗型=红，妥协型=黄
    - 协作风格：主动同步=蓝，被动响应=灰，创意发散=紫，主导推进=橙
    - 沟通方式：结构化=蓝，意识流=灰，跳跃式=紫，结论先行=橙
  - 标签样式：text-xs px-2 py-1 rounded-full font-medium

### Section 3：团队诊断报告

- 标题"团队诊断"（text-xl font-bold text-fox-navy mb-4）
- 诊断卡片，纵向排列（gap-4）：

卡片1 - 能力分布诊断（bg-white border rounded-2xl p-6）：
- "团队优势"部分：
  - 🟢 图标 + 优势描述（每条一行）
- "团队短板"部分：
  - 🔴 图标 + 短板描述 + 建议（每条一行）
- 短板如果是严重缺口，用fox-coral背景高亮

卡片2 - 分工建议（bg-white border rounded-2xl p-6）：
- 5个组别，每个组别一行：
  - 组别图标+名称
  - 主攻队员（头像+名字）
  - 辅助队员（头像+名字，如果有）
  - 具体职责描述
- 用卡片内嵌的小卡片样式，每个组别一个小block

卡片3 - 协作风险分析（bg-fox-coral/5 border border-fox-coral/20 rounded-2xl p-6）：
- ⚠️ 图标 + "协作风险提示"
- 每个风险一行：
  - 风险描述
  - → 建议（用→分隔）
- 这部分用fox-coral色系，提醒注意

卡片4 - 互补性分析（bg-fox-mint/5 border border-fox-mint/20 rounded-2xl p-6）：
- 💡 图标 + "互补性分析"
- 每个互补组合一行：
  - 队员A + 队员B → 组合优势描述

### Section 4：空状态设计
如果团队还没有人完成测评：
- 居中显示狐狸SVG（128x128）
- "还没有队员完成测评"
- "把邀请链接发给队友吧！" + 邀请链接复制按钮
- 如果只有1-2人完成：显示已有数据，但提示"建议全队完成测评后查看完整诊断"

═══════════════════════════════════════════════════════
组件清单
═══════════════════════════════════════════════════════

请实现以下可复用组件：

1. FoxAvatar（props: size, expression）
   - SVG狐狸头像，8种表情切换
   - 表情用不同的path/eye/mouth配置实现
   - 呼吸动画 + 随机眨眼
   - 表情切换用Framer Motion crossfade

2. ChatBubble（props: role, children, timestamp）
   - role: "ai" | "user"
   - AI气泡白色靠左，用户气泡藏青色靠右
   - 出现动画：fade + slide-up

3. FileUpload（props: onUpload, accept）
   - 虚线框拖拽上传区域
   - 支持点击上传
   - 上传后显示文件卡片

4. AbilityBar（props: icon, name, score, maxScore, status）
   - 能力进度条
   - status: "verified" | "unverified" | "untested"
   - 填充动画

5. RadarChart（props: data）
   - 用Recharts封装的雷达图
   - 5维度能力分布

6. Tag（props: type, children）
   - 彩色标签组件
   - type: "orange" | "green" | "red" | "yellow" | "gray" | "navy" | "purple"

7. ProgressIndicator（props: steps, currentStep）
   - 测评进度指示器（用于左栏）
   - 5个组别的完成状态

8. InsightCard（props: icon, text, delay）
   - 实时洞察小卡片
   - 出现动画：fade + slide-right

9. ScoreComparison（props: dimension, selfScore, actualScore）
   - 自评vs实测对比条
   - 两个并排的进度条

10. TeamMatrix（props: members, abilities）
    - 团队能力矩阵表格
    - 支持表格/热力图两种模式切换

11. ConfirmDialog（props: title, message, onConfirm, onCancel）
    - 确认对话框
    - 背景遮罩 + 居中卡片

12. CopyButton（props: text, label）
    - 点击复制按钮
    - 复制成功后显示"已复制 ✓"

═══════════════════════════════════════════════════════
数据模型（TypeScript类型定义）
═══════════════════════════════════════════════════════

```typescript
// 能力维度
type AbilityKey = 'background_market' | 'product' | 'tech' | 'finance' | 'design';

// 验证状态
type VerifyStatus = 'verified' | 'unverified' | 'untested';

// 表情状态
type Expression = 'smile' | 'thinking' | 'curious' | 'challenge' | 'nod' | 'surprised' | 'encourage' | 'serious';

// 能力评分
interface Ability {
  score: number;          // 0-10
  verified: VerifyStatus;
  evidence: string | null;
}

// 行为模式
interface BehaviorPatterns {
  stress_response: string;
  conflict_handling: string;
  collaboration_style: string;
  communication_style: string;
}

// 自我认知偏差
interface Bias {
  dimension: string;
  self_score: number;
  actual_score: number;
  direction: 'high' | 'low' | 'accurate';
  suggestion: string;
}

// 个人画像
interface UserProfile {
  user_id: string;
  user_name: string;
  team_id: string;
  timestamp: string;
  core_positioning: string;        // 核心定位一句话
  abilities: Record<AbilityKey, Ability>;
  top_advantages: { title: string; evidence: string }[];
  weaknesses: string[];
  behavior_patterns: BehaviorPatterns;
  self_awareness: {
    overall_accuracy: string;
    biases: Bias[];
  };
  ai_discoveries: string[];
  team_role: {
    main_group: string;
    secondary_group: string;
    tags: string[];
    best_partners: { type: string; reason: string }[];
    avoid_partners: { type: string; reason: string }[];
  };
  feedback?: { rating: 'accurate' | 'mostly' | 'inaccurate'; comment?: string };
}

// 团队
interface Team {
  team_id: string;
  team_name: string;
  competition_type: string;
  organizer_name: string;
  members: UserProfile[];
  created_at: string;
}

// 对话消息
interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  expression?: Expression;    // AI消息的表情tag
  timestamp: string;
  file?: { name: string; size: number; url: string };
  insights?: string[];        // AI消息附带的实时洞察
}

// 实时测评状态
interface AssessmentState {
  current_expression: Expression;
  covered_dimensions: Record<AbilityKey, 'untested' | 'in_progress' | 'done'>;
  key_events: { stress: boolean; conflict: boolean };
  elapsed_minutes: number;
  insights: { icon: string; text: string }[];
}
```

═══════════════════════════════════════════════════════
Zustand Store设计
═══════════════════════════════════════════════════════

```typescript
// store/useStore.ts

interface StoreState {
  // 团队
  currentTeam: Team | null;
  teams: Team[];              // localStorage中的所有团队

  // 用户
  currentUser: UserProfile | null;
  userProfiles: UserProfile[]; // localStorage中的所有画像

  // 对话
  messages: ChatMessage[];
  assessmentState: AssessmentState;

  // Actions
  createTeam: (name: string, type: string, organizer: string) => string;
  joinTeam: (teamId: string, userName: string) => void;
  addMessage: (msg: ChatMessage) => void;
  updateExpression: (expr: Expression) => void;
  updateDimensionStatus: (dim: AbilityKey, status: 'untested' | 'in_progress' | 'done') => void;
  triggerKeyEvent: (type: 'stress' | 'conflict') => void;
  addInsight: (insight: { icon: string; text: string }) => void;
  saveProfile: (profile: UserProfile) => void;
  getTeamProfiles: (teamId: string) => UserProfile[];
  submitFeedback: (userId: string, rating: string, comment?: string) => void;
}
```

═══════════════════════════════════════════════════════
Mock数据
═══════════════════════════════════════════════════════

请在 src/mock/data.ts 中提供以下mock数据：

1. 一个完整的团队（4个成员）的mock数据，每个成员有完整的UserProfile
2. 一个正在进行的对话的mock消息列表（至少10条消息，展示不同表情状态）
3. 一个完整的AssessmentState mock

这些mock数据用于：
- 团队看板页直接展示效果
- 对话页开发时无需连接真实AI即可调试UI
- 画像页展示完整的画像效果

═══════════════════════════════════════════════════════
狐狸SVG设计规范
═══════════════════════════════════════════════════════

请在 src/components/FoxAvatar.tsx 中实现一个纯SVG的狐狸头像组件。

基本构造：
- 头部：圆形/椭圆，fill="#FF9F4D"
- 耳朵：两个三角形（圆角），在头顶左右，fill="#FF9F4D"，内耳fill="#FFB87A"
- 眼睛：根据表情变化
- 嘴巴：根据表情变化
- 脸颊：两个小圆点（腮红），fill="#FFD93D"半透明
- 围巾：在头部下方，一个弧形带子，fill="#2B4C7E"
- 围巾上有一个小队徽（圆形+星星）

8种表情的眼睛和嘴巴变化（用条件渲染）：

smile:
  眼睛：两条向下弯的弧线（^^），stroke="#2B4C7E" stroke-width="2"
  嘴巴：向上弯的弧线

thinking:
  眼睛：正常圆点，但看向右上方
  嘴巴：小直线，微微歪向一侧
  额外：在脸的右侧画一个小手（圆点）托腮

curious:
  眼睛：大圆，fill="#2B4C7E"，内有星星高光（小十字）
  嘴巴：小O形
  耳朵：更竖直

challenge:
  眼睛：一只正常，一只眯起（一条线）
  嘴巴：歪向一侧的线

nod:
  眼睛：两条向下弯的弧线（^^），比smile更弯
  嘴巴：比smile更大的弧线
  整个头部微微下倾

surprised:
  眼睛：大圆，fill="#2B4C7E"
  嘴巴：大O形

encourage:
  眼睛：半弯弧线（比smile柔和）
  嘴巴：温柔微笑

serious:
  眼睛：正常圆点，正视前方
  嘴巴：一条直线

所有表情切换用Framer Motion的AnimatePresence做crossfade，duration 300ms。

呼吸动画：整个SVG group做scale 1→1.02→1，duration 3s，repeat Infinity。
眨眼动画：每5-8秒，眼睛scaleY 1→0.1→1，duration 150ms（serious和surprised表情不眨眼）。

═══════════════════════════════════════════════════════
AI对话集成（预留接口）
═══════════════════════════════════════════════════════

MVP阶段先不接真实AI，用mock回复模拟对话。但预留好接口：

```typescript
// lib/ai.ts

interface AIResponse {
  content: string;          // AI回复文字
  expression: Expression;   // 表情tag
  insights?: { icon: string; text: string }[];  // 实时洞察
  dimension_update?: { dimension: AbilityKey; status: 'in_progress' | 'done' }[];
  key_event?: 'stress' | 'conflict';
  is_final?: boolean;       // 是否是最终画像生成
  profile?: UserProfile;    // 如果是最终回复，附带画像
}

// MVP阶段用mock实现
export async function sendToAI(messages: ChatMessage[]): Promise<AIResponse> {
  // TODO: 替换为真实的扣子Bot API调用
  // const response = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages }) });
  // return response.json();

  // Mock: 根据用户最后一条消息返回模拟回复
  return mockAIResponse(messages);
}
```

mock对话逻辑：
- 维护一个简单的关键词匹配规则
- 如果用户消息包含"数据""分析""SPSS""回归"等关键词 → 返回数据分析相关的追问
- 如果用户消息包含"市场""调研""竞品"等关键词 → 返回市场分析的追问
- 每条mock回复随机附带一个expression tag
- 第8-12条消息后，触发收束，返回完整画像JSON
- 对话过程中每3-4条消息，附带一个insight

═══════════════════════════════════════════════════════
项目文件结构
═══════════════════════════════════════════════════════

```
src/
├── app/
│   ├── layout.tsx                 # RootLayout
│   ├── page.tsx                   # 落地页
│   ├── team/
│   │   ├── create/page.tsx        # 创建团队
│   │   └── [teamId]/
│   │       ├── page.tsx           # 团队看板
│   │       └── join/page.tsx      # 加入团队
│   ├── chat/[teamId]/page.tsx     # 对话测评页
│   └── profile/
│       ├── [userId]/page.tsx      # 个人画像
│       └── [userId]/feedback/page.tsx
├── components/
│   ├── FoxAvatar.tsx              # 狐狸SVG组件
│   ├── ChatBubble.tsx
│   ├── FileUpload.tsx
│   ├── AbilityBar.tsx
│   ├── RadarChart.tsx
│   ├── Tag.tsx
│   ├── ProgressIndicator.tsx
│   ├── InsightCard.tsx
│   ├── ScoreComparison.tsx
│   ├── TeamMatrix.tsx
│   ├── ConfirmDialog.tsx
│   ├── CopyButton.tsx
│   └── Layout/
│       ├── Navbar.tsx
│       └── PageContainer.tsx
├── store/
│   └── useStore.ts                # Zustand store
├── lib/
│   ├── ai.ts                      # AI接口（mock实现）
│   ├── storage.ts                 # localStorage封装
│   └── utils.ts                   # 工具函数
├── types/
│   └── index.ts                   # TypeScript类型定义
├── mock/
│   └── data.ts                    # Mock数据
└── styles/
    └── globals.css                # Tailwind + 自定义样式
```

═══════════════════════════════════════════════════════
实现优先级
═══════════════════════════════════════════════════════

请按以下优先级实现，确保每一步都可运行：

Phase 1（核心，先做）：
1. 项目初始化 + Tailwind配置 + 全局样式
2. 类型定义 + Zustand store + localStorage封装
3. FoxAvatar组件（8种表情 + 动画）
4. 落地页
5. 创建团队页 + 加入团队页

Phase 2（对话，核心）：
6. 对话测评页（三栏布局 + 对话UI + 狐狸形象 + 进度面板 + 实时洞察）
7. Mock AI回复逻辑
8. 文件上传组件

Phase 3（画像，核心）：
9. 个人画像页（所有Section）
10. 雷达图 + 能力条 + 行为模式卡 + 自我认知校准 + AI发现
11. 画像反馈页

Phase 4（团队，核心）：
12. 团队看板页（能力矩阵 + 协作图谱 + 诊断报告）
13. 团队矩阵热力图模式
14. 空状态设计

Phase 5（打磨）：
15. 所有页面动画打磨
16. 移动端适配
17. Mock数据完善

═══════════════════════════════════════════════════════
注意事项
═══════════════════════════════════════════════════════

1. 所有页面都要支持移动端响应式（用Tailwind的md: lg: 前缀）
2. 对话页在移动端要特殊处理：左栏隐藏，右栏变成顶部小狐狸
3. 所有颜色必须用上面定义的自定义颜色，不要用Tailwind默认色
4. 所有动画用Framer Motion，不要用CSS animation（除了简单的hover）
5. 狐狸SVG必须是纯代码实现，不依赖外部图片资源
6. 雷达图用Recharts，不要用其他图表库
7. 所有交互元素必须有hover和active状态
8. 所有loading状态用骨架屏或狐狸的thinking动画
9. 确保所有组件都有TypeScript类型
10. 不要使用任何UI组件库（如Ant Design、Material UI），全部用Tailwind手写

开始实现。从Phase 1开始，确保每一步完成后都可以运行npm run dev查看效果。
```
