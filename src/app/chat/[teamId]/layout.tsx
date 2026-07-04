import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "能力测评",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
