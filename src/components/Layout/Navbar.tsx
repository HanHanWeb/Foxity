"use client";

import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

interface NavbarProps {
  title?: string;
  rightSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
}

export function Navbar({ title = "狐狸学长", rightSlot, centerSlot }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-fox-gray-light bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/fox.png" alt={title} width={36} height={36} className="rounded-lg" />
          <span className="text-base font-bold text-fox-navy">{title}</span>
        </Link>
        {centerSlot && <div className="hidden md:block">{centerSlot}</div>}
        <div className="flex items-center gap-2">{rightSlot}</div>
      </div>
      <Separator />
    </header>
  );
}
