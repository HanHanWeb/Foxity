"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function HomeNavbar() {
  const router = useRouter();
  const { user } = useAuth(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/auth");
    router.refresh();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-fox-gray-light/60 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/fox.png" alt="Foxity" width={36} height={36} className="rounded-lg" />
          <span className="text-base font-bold text-fox-navy">Foxity</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/team/create"
            className="hidden rounded-xl bg-fox-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-fox-navy-light sm:block"
          >
            开始测评
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-fox-navy transition-colors hover:bg-fox-cream sm:block"
            >
              控制台
            </Link>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="rounded-xl px-3 py-2 text-sm font-medium text-fox-gray transition-colors hover:bg-fox-cream hover:text-fox-navy"
            >
              退出
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
