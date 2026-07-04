# 🦊 狐狸学长 - 团队能力测评

基于 Next.js 14 + shadcn/UI 的大学生团队能力测评产品。通过 AI 对话式测评，帮助团队了解每个成员的能力画像和团队整体能力分布。

## ✨ 核心功能

- **🎯 对话式测评** - 和狐狸学长聊天，自然完成能力测评
- **📊 个人画像** - 五维能力雷达图、自评 vs 实测对比、行为模式分析
- **👥 团队看板** - 能力矩阵、分布分析、成员列表、风险预警
- **🎨 狐狸品牌设计** - 纯 SVG 狐狸头像、8 种表情、品牌色系统
- **📱 响应式设计** - 完美适配桌面和移动端

## 🛠️ 技术栈

- **框架**: Next.js 14.2 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/UI
- **动画**: Framer Motion
- **状态管理**: Zustand
- **图表**: Recharts
- **图标**: Lucide React
- **AI**: DeepSeek (通过 aiping.cn 代理)

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 生产模式运行
npm run start
```

访问 http://localhost:3000 开始使用。

## 📁 项目结构

```
src/
├── app/                    # App Router 页面
│   ├── page.tsx            # 落地页
│   ├── team/create/        # 创建团队
│   ├── team/[teamId]/      # 团队看板
│   ├── team/[teamId]/join/ # 加入团队
│   ├── chat/[teamId]/      # 对话测评
│   ├── profile/[teamId]/   # 个人画像
│   └── api/chat/           # AI 对话 API 代理
├── components/
│   ├── ui/                 # shadcn/UI 基础组件
│   ├── FoxAvatar.tsx       # 狐狸头像组件
│   ├── ChatMessage.tsx     # 聊天气泡
│   ├── AbilityRadar.tsx    # 能力雷达图
│   ├── TeamMatrix.tsx      # 团队能力矩阵
│   └── ...                 # 其他业务组件
├── store/useStore.ts       # Zustand 全局状态
├── lib/
│   ├── ai.ts               # AI 对话接口
│   └── storage.ts          # localStorage 工具
└── types/index.ts          # TypeScript 类型定义
```

## 🧠 AI 配置

项目默认使用 **DeepSeek-V4-Flash** 模型，通过 aiping.cn 代理访问。

如需更换模型，设置环境变量：

```bash
DEEPSEEK_BASE_URL=https://aiping.cn/api/v1
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_MODEL=DeepSeek-V4-Pro
```

## 📄 页面路由

| 页面 | 路径 | 说明 |
|------|------|------|
| 落地页 | `/` | 品牌展示与入口 |
| 创建团队 | `/team/create` | 创建团队并生成邀请码 |
| 加入团队 | `/team/[teamId]/join` | 输入名字加入团队 |
| 对话测评 | `/chat/[teamId]` | 核心测评对话 |
| 个人画像 | `/profile/[teamId]` | 测评结果与能力分析 |
| 团队看板 | `/team/[teamId]` | 团队能力矩阵与成员管理 |

## 📊 五维能力模型

| 维度 | 说明 |
|------|------|
| background_market | 市场/行业/调研/数据分析 |
| product | 产品思维/需求洞察/用户体验 |
| tech | 技术/代码/架构/工程能力 |
| finance | 商业/财务/盈利模式/成本核算 |
| design | 设计/视觉/审美/PPT/UI |

## 📝 License

MIT
