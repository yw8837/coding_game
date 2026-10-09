import type { Metadata } from "next";
import "./globals.css";
import "./repair.css";
import "./desktop.css";
import "./lesson.css";
import "./workflow.css";
import "./pc.css";
import "./practice.css";
import "./career.css";
import "./game-art.css";
import "./release.css";
import "./coach.css";
import "./learning.css";
import "./code-lab.css";
import "./challenges-hub.css";
import "./workstation-shell.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://codeshift-lab.bsfire1237.chatgpt.site"),
  title: "CODE:SHIFT — 컴퓨터 속 작은 사건들",
  description: "바탕화면에서 메시지를 열고, 화면과 코드를 직접 고쳐 손님 주문을 해결하세요. 카페 3장과 동네 의뢰 18개를 거쳐 내 첫 동네 생활 웹앱을 출시하는 코딩 시뮬레이터. 한국어·영어·일본어를 지원합니다.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", title: "CODE:SHIFT", description: "내 컴퓨터에서 시작하는 작은 사건들. 직접 고치고, 확인하고, 전달하세요.", url: "/", siteName: "CODE:SHIFT", locale: "ko_KR", images: [{url:"/screenshots/desktop.png",width:1440,height:900,alt:"CODE:SHIFT desktop with taskbar and quest tracker"}] },
  twitter: {card:"summary_large_image",title:"CODE:SHIFT",images:["/screenshots/desktop.png"]},
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
