import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-sans-sc",
});

export const metadata: Metadata = {
  title: "狐狸学长",
  description: "AI 能动性驱动的团队能力测评产品",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={notoSansSc.variable}>{children}</body>
    </html>
  );
}
