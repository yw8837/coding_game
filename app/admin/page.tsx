import Link from 'next/link';
import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from '@/app/chatgpt-auth';
import {isDashboardOwner} from '@/lib/demo-store';
import {DemoDashboard} from './DemoDashboard';
import './dashboard.css';
export const dynamic='force-dynamic';
export const metadata={title:'데모 운영 | CODE:SHIFT',robots:{index:false,follow:false}};

export default async function AdminPage(){
 const user=await getChatGPTUser();
 if(!user)return <main className="demo-admin-access"><span>CODE:SHIFT / OPERATIONS</span><h1>데모 운영 대시보드</h1><p>운영자 계정으로 로그인해 주세요. 게임은 로그인 없이 플레이할 수 있습니다.</p><a href={chatGPTSignInPath('/admin')} target="_top">ChatGPT로 로그인</a><Link href="/">게임으로 돌아가기</Link></main>;
 if(!await isDashboardOwner())return <main className="demo-admin-access"><h1>운영자 전용 화면입니다.</h1><p>이 계정에는 조회 권한이 없습니다.</p><a href={chatGPTSignOutPath('/admin')} target="_top">로그아웃 · 계정 변경</a><Link href="/">게임으로 돌아가기</Link></main>;
 return <DemoDashboard/>;
}
