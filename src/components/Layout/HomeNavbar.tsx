"use client";

import Link from "next/link";

export function HomeNavbar() {
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
        </div>
      </div>
    </header>
  );
}
