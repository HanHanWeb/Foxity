"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string; desc?: string }[];
}

const navLinks: NavLink[] = [
  {
    label: "产品功能",
    href: "/#features",
    children: [
      { label: "自适应测评", href: "/#features", desc: "AI 动态调整问题" },
      { label: "三层画像", href: "/#features", desc: "技能·行为·认知" },
      { label: "狐狸学长", href: "/#features", desc: "可爱但专业" },
    ],
  },
  {
    label: "使用流程",
    href: "/#flow",
    children: [
      { label: "创建团队", href: "/team/create", desc: "组织者发起测评" },
      { label: "邀请队友", href: "/#flow", desc: "分享邀请码" },
      { label: "AI 对话", href: "/chat/FOX3A7", desc: "20 分钟聊出画像" },
      { label: "查看结果", href: "/profile/FOX3A7", desc: "能力雷达与建议" },
    ],
  },
  { label: "关于", href: "/#about" },
];

export function HomeNavbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenMenu(label);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenMenu(null), 150);
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-fox-gray-light/60 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/fox.png" alt="狐狸学长" width={36} height={36} className="rounded-lg" />
          <span className="text-base font-bold text-fox-navy">狐狸学长</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" onMouseLeave={handleLeave}>
          {navLinks.map((link) => (
            <div key={link.label} className="relative" onMouseEnter={() => handleEnter(link.label)}>
              <Link
                href={link.href}
                className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-fox-navy/80 transition-colors hover:bg-fox-cream/60 hover:text-fox-navy"
              >
                {link.label}
                {link.children && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
              </Link>

              {link.children && openMenu === link.label && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="min-w-[220px] overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-xl backdrop-blur-xl">
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-3 transition-colors hover:bg-fox-cream/60"
                        onClick={() => setOpenMenu(null)}
                      >
                        <div className="text-sm font-semibold text-fox-navy">{child.label}</div>
                        {child.desc && <div className="mt-0.5 text-xs text-fox-gray">{child.desc}</div>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/team/create"
            className="hidden rounded-xl bg-fox-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-fox-navy-light sm:block"
          >
            开始测评
          </Link>
        </div>
      </div>
    </header>
  );
}
