import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "成员详情",
};

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
