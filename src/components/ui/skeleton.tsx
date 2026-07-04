import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-fox-gray-bg", className)}
      {...props}
    />
  )
}

/** 顶部导航栏骨架（HomeNavbar 结构） */
function NavbarSkeleton() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-fox-gray-light/60 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="hidden h-9 w-20 rounded-xl sm:block" />
          <Skeleton className="hidden h-9 w-16 rounded-xl sm:block" />
          <Skeleton className="h-9 w-14 rounded-xl" />
        </div>
      </div>
    </header>
  )
}

/** 首页骨架屏 — 匹配首页左右分栏布局 */
function HomeSkeleton() {
  return (
    <main className="min-h-screen">
      <NavbarSkeleton />
      <section className="relative flex min-h-screen items-center overflow-hidden bg-[#fbf7ef] px-6 py-28">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-[1fr_0.95fr]">
          {/* 左侧文字区 */}
          <div>
            <div className="mb-12 flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-14 w-full md:h-20" />
            <Skeleton className="mt-2 h-14 w-3/4 md:h-20" />
            <Skeleton className="mt-8 h-6 w-full max-w-md" />
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-12 w-60 rounded-full" />
              <Skeleton className="h-12 w-32 rounded-full" />
            </div>
            <div className="mt-16 flex flex-wrap gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-full" />
              ))}
            </div>
          </div>
          {/* 右侧圆形装饰区 */}
          <div className="relative flex min-h-[520px] items-center justify-center">
            <Skeleton className="h-[360px] w-[360px] rounded-full lg:h-[420px] lg:w-[420px]" />
            <Skeleton className="absolute left-12 top-16 h-10 w-32 rounded-full" />
            <Skeleton className="absolute right-0 top-40 h-10 w-28 rounded-full" />
            <Skeleton className="absolute bottom-20 left-16 h-10 w-32 rounded-full" />
          </div>
        </div>
      </section>
    </main>
  )
}

/** 控制台骨架屏 — 匹配控制台导航+标题+两个团队列表区 */
function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-white pb-12">
      <NavbarSkeleton />
      <div className="mx-auto max-w-5xl px-4 pt-24 md:px-6">
        <Skeleton className="mb-4 h-9 w-28 rounded-lg" />
        <Skeleton className="mb-8 h-8 w-28" />
        {/* 我创建的团队 */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />
            ))}
          </div>
        </section>
        {/* 我加入的团队 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-[72px] w-full rounded-2xl" />
          </div>
        </section>
      </div>
    </main>
  )
}

/** 创建团队页骨架屏 — 匹配居中卡片表单 */
function CreateTeamSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Skeleton className="mb-4 h-9 w-28 rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-2xl">
          <div className="p-6">
            <Skeleton className="mb-2 h-6 w-32" />
            <Skeleton className="mb-6 h-4 w-72" />
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="mb-6 h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </Skeleton>
      </div>
    </main>
  )
}

/** 加入团队页骨架屏 — 匹配居中小卡片 */
function JoinTeamSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Skeleton className="h-[300px] w-full rounded-2xl">
          <div className="flex flex-col items-center p-6">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <Skeleton className="mt-3 h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-32" />
            <div className="mt-6 w-full space-y-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </Skeleton>
      </div>
    </main>
  )
}

/** 画像页骨架屏 — 匹配头像+标签+雷达图+对比图布局 */
function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-white pb-12">
      <header className="border-b border-fox-gray-light bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* 头像 + 姓名 */}
        <div className="mb-8 flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <Skeleton className="h-[100px] w-[100px] rounded-2xl" />
          <div className="space-y-2 text-center md:text-left">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        {/* Tabs */}
        <Skeleton className="mb-6 h-10 w-full rounded-lg" />
        {/* 标签 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
        {/* 雷达图 + 对比图 */}
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  )
}

/** 成员详情页骨架屏 — 匹配雷达图+统计+技能评估布局 */
function MemberDetailSkeleton() {
  return (
    <main className="min-h-screen bg-white pb-12">
      <header className="sticky top-0 z-30 border-b border-fox-gray-light bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-6">
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* 成员头部 */}
        <Skeleton className="h-9 w-28" />
        <Skeleton className="mt-2 h-4 w-64" />
        {/* 雷达图 + 对话统计 */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        {/* 硬技能评估 */}
        <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
        {/* 软实力评估 */}
        <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
        {/* 关键对话证据 */}
        <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
        {/* 团队适配建议 */}
        <Skeleton className="mt-6 h-40 w-full rounded-2xl" />
      </div>
    </main>
  )
}

export {
  Skeleton,
  HomeSkeleton,
  DashboardSkeleton,
  CreateTeamSkeleton,
  JoinTeamSkeleton,
  ProfileSkeleton,
  MemberDetailSkeleton,
}
