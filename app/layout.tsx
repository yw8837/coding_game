import type { Metadata } from "next";
import "./globals.css";
import "./repair.css";
import "./desktop.css";
import "./lesson.css";
import "./workflow.css";

export const metadata: Metadata = {
  title: "CODE:SHIFT — 동네 해결사",
  description: "코드를 몰라도 괜찮아요. 컴퓨터를 직접 조작하며 모노 카페의 세 가지 사건을 해결하는 게임.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
