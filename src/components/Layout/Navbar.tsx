"use client";

import Link from "next/link";
import { FoxAvatar } from "@/components/FoxAvatar";
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
          <FoxAvatar size={40} breathing={false} blinking={false} />
          <span className="text-base font-bold text-fox-navy">{title}</span>
        </Link>
        {centerSlot && <div className="hidden md:block">{centerSlot}</div>}
        <div className="flex items-center gap-2">{rightSlot}</div>
      </div>
      <Separator />
    </header>
  );
}
