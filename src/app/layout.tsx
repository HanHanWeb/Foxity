import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foxity",
  description: "AI 能动性驱动的团队能力测评产品",
  icons: {
    icon: "/fox.png",
    shortcut: "/fox.png",
    apple: "/fox.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-fox-cream text-fox-navy antialiased">
        {children}
      </body>
    </html>
  );
}
