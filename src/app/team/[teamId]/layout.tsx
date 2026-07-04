import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "团队看板",
    template: "%s - Foxity",
  },
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
