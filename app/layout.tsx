import type { Metadata } from "next";
import "./globals.css";
import "./repair.css";
import "./desktop.css";
import "./lesson.css";
import "./workflow.css";
import "./pc.css";
import "./practice.css";
import "./career.css";
import "./career-playground.css";
import './career-code.css';
import "./game-art.css";
import "./release.css";
import "./coach.css";
import "./learning.css";
import "./code-lab.css";
import "./challenges-hub.css";
import "./workstation-shell.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://code.yeolmaeapps.kr"),
  title: "Localhost Hero 무료 데모 | 우리 동네 코딩 시뮬레이터",
  description: "가상 컴퓨터에서 카페 메뉴판, 계산대와 주문 연결을 고쳐 보세요. 카페 입문 3장과 오픈 행사까지 무료로 플레이하는 브라우저 코딩 시뮬레이터 데모. 한국어·영어·일본어를 지원합니다.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", title: "Localhost Hero · Free Neighborhood Coding Sim Demo", description: "Repair a cafe menu, fix its till and connect customer orders. Three free browser chapters and an opening celebration.", url: "/", siteName: "Localhost Hero", locale: "ko_KR", images: [{url:"https://code.yeolmaeapps.kr/media/first-release-poster-en.jpg?v=share-20261010",secureUrl:"https://code.yeolmaeapps.kr/media/first-release-poster-en.jpg?v=share-20261010",type:"image/jpeg",width:1280,height:720,alt:"CODE:SHIFT — Fix bugs. Ship your app. Full-game development preview."}] },
  twitter: {card:"summary_large_image",title:"CODE:SHIFT · Free Coding Simulator Demo",description:"Three cafe chapters on a virtual desktop. Free in your PC browser, with Korean, English and Japanese.",images:[{url:"https://code.yeolmaeapps.kr/media/first-release-poster-en.jpg?v=share-20261010",alt:"CODE:SHIFT — Fix bugs. Ship your app. Full-game development preview."}]},
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
