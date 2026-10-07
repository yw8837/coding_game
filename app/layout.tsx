import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CODE:SHIFT — 입문 데모",
  description: "그롬, COOCLE, CatHub와 가상 터미널. 첫 코드부터 첫 배포까지 직접 완주하는 개발자 시뮬레이터.",
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
