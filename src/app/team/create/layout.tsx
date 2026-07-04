import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "创建团队",
};

export default function TeamCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
