import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-sans-sc",
});

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
    <html lang="zh-CN" className={notoSansSc.variable}>
      <body className="min-h-screen bg-fox-cream text-fox-navy antialiased">
        {children}
      </body>
    </html>
  );
}
