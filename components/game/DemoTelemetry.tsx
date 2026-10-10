'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {Language} from '@/lib/game/i18n';
import type {DemoPulse} from '@/lib/demo-metrics';
import '@/app/demo-feedback.css';

const PREFERENCE='codeshift-demo-metrics-consent',SESSION='codeshift-demo-metrics-session';
export function useDemoTelemetry({available,language,stage,mode}:{available:boolean;language:Language;stage:string;mode:DemoPulse['mode']}){
 const [enabled,setEnabled]=useState(false);
 const current=useRef({language,stage,mode}),flush=useRef<()=>void>(()=>{});
 useEffect(()=>{current.current={language,stage,mode};const timer=setTimeout(()=>flush.current(),1500);return()=>clearTimeout(timer);},[language,stage,mode]);
 // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore this device's explicit opt-in after hydration.
 useEffect(()=>{try{setEnabled(localStorage.getItem(PREFERENCE)==='true');}catch{}},[]);
 const choose=useCallback((value:boolean)=>{setEnabled(value);try{localStorage.setItem(PREFERENCE,String(value));if(!value)sessionStorage.removeItem(SESSION);}catch{}},[]);
 useEffect(()=>{
  if(!available||!enabled)return;
  let cancelled=false,busy=false,session='',lastInteraction=Date.now(),lastSent=Date.now();
  const abort=new AbortController();
  const active=()=>{lastInteraction=Date.now();};
  const request=async(body:unknown)=>fetch('/api/demo-metrics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:abort.signal});
  const send=async()=>{
   if(cancelled||busy||document.hidden)return;busy=true;
   try{
    if(!session){
     try{const previous=JSON.parse(sessionStorage.getItem(SESSION)||'null');if(previous&&typeof previous.id==='string'&&previous.created>Date.now()-86400000)session=previous.id;}catch{}
     if(!session){const response=await request({action:'visit',language:current.current.language});if(!response.ok)return;const data=await response.json();if(cancelled||!data||typeof data!=='object'||!('session'in data)||typeof data.session!=='string')return;session=data.session;try{sessionStorage.setItem(SESSION,JSON.stringify({id:session,created:Date.now()}));}catch{}return;}
    }
    const seconds=Date.now()-lastInteraction<60000?Math.min(30,Math.floor((Date.now()-lastSent)/1000)):0;
    const response=await request({...current.current,session,seconds});
    if(response.status===410){session='';try{sessionStorage.removeItem(SESSION);}catch{}}
    if(response.ok){await response.json();lastSent=Date.now();}
   }catch{/* Telemetry must never interrupt or roll back the game. */}finally{busy=false;}
  };
  const visibility=()=>{lastSent=Date.now();if(!document.hidden){lastInteraction=Date.now();void send();}};
  flush.current=()=>void send();void send();
  const timer=setInterval(()=>void send(),15000);
  window.addEventListener('pointerdown',active,{passive:true});window.addEventListener('keydown',active);document.addEventListener('visibilitychange',visibility);
  return()=>{cancelled=true;abort.abort();clearInterval(timer);flush.current=()=>{};window.removeEventListener('pointerdown',active);window.removeEventListener('keydown',active);document.removeEventListener('visibilitychange',visibility);};
 },[available,enabled]);
 return {enabled,choose};
}

export function DemoFeedbackSettings({language,stage,enabled,onEnabled}:{language:Language;stage:string;enabled:boolean;onEnabled:(value:boolean)=>void}){
 const tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[language];
 const [message,setMessage]=useState(''),[experience,setExperience]=useState('none'),[website,setWebsite]=useState(''),[status,setStatus]=useState<'idle'|'sending'|'sent'|'error'>('idle');
 return <section className="demo-feedback-settings" data-no-translate>
  <div className="settings-row"><div><strong>{tr('데모 개선에 참여','Help improve the demo','デモの改善に協力')}</strong><p>{tr('동의하면 진행 단계·활동 시간·언어를 익명으로 전송해요. 코드·명령어·저장 파일은 보내지 않아요. 언제든 끌 수 있어요. 90일 지난 기록은 다음 신규 집계 때 정리해요.','Opt in to share anonymous progress steps, active time and language. Your code, commands and save files stay here. You can turn this off any time. Records older than 90 days are cleared when new sessions are collected.','同意すると進行段階・操作時間・言語を匿名で送信します。コード・コマンド・セーブは送りません。いつでもオフにできます。90日を過ぎた記録は、次の新規セッション集計時に削除します。')}</p></div><input type="checkbox" data-testid="demo-metrics-consent" aria-label={tr('익명 플레이 통계 제공','Share anonymous play statistics','匿名プレイ統計を送信')} checked={enabled} onChange={event=>onEnabled(event.target.checked)}/></div>
  <details><summary>{tr('막힌 곳이나 의견 보내기','Send feedback or tell us where you got stuck','つまずいたところ・感想を送る')}</summary><form onSubmit={async event=>{event.preventDefault();if(status==='sending')return;setStatus('sending');try{const response=await fetch('/api/demo-feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language,stage,experience,message,website})});if(!response.ok)throw Error();await response.json();setStatus('sent');setMessage('');}catch{setStatus('error');}}}>
   <p>{tr('내용과 현재 단계·언어·선택한 코딩 경험을 개발자에게 보내요. 이름·이메일·개인정보는 적지 마세요. 90일 지난 기록은 다음 신규 집계 때 정리해요.','This sends your message, current step, language and selected coding experience to the developer. Please leave out names, email addresses and personal details. Records older than 90 days are cleared when new sessions are collected.','内容と現在の段階・言語・選んだコーディング経験を開発者に送ります。名前・メール・個人情報は書かないでください。90日を過ぎた記録は、次の新規セッション集計時に削除します。')}</p>
   <label>{tr('코딩 경험','Coding experience','コーディング経験')}<select value={experience} onChange={event=>setExperience(event.target.value)}><option value="none">{tr('처음이에요','None yet','初めて')}</option><option value="some">{tr('조금 해봤어요','A little','少しある')}</option><option value="experienced">{tr('코딩을 할 줄 알아요','I can code','コードを書ける')}</option></select></label>
   <label>{tr('어디서 막혔나요? 무엇이 재미있었나요?','Where did you get stuck? What was fun?','どこで迷いましたか？何が楽しかったですか？')}<textarea required minLength={5} maxLength={1000} rows={4} value={message} onChange={event=>{setMessage(event.target.value);setStatus('idle');}}/></label>
   <label className="demo-feedback-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={event=>setWebsite(event.target.value)}/></label>
   <button className="outline-button" disabled={status==='sending'||message.trim().length<5}>{status==='sending'?tr('보내는 중…','Sending…','送信中…'):tr('의견 보내기','Send feedback','感想を送る')}</button><p role="status">{status==='sent'?tr('보냈어요. 의견 고마워요!','Sent. Thanks for your feedback!','送信しました。ありがとうございます！'):status==='error'?tr('전송하지 못했어요. 내용을 유지했으니 잠시 후 다시 시도해 주세요.','Could not send. Your message is still here; please try again later.','送信できませんでした。内容は残っています。少し待ってから再試行してください。'):''}</p>
  </form></details>
 </section>;
}
