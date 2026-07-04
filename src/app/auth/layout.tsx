import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录注册",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
