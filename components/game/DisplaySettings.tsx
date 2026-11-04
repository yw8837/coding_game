'use client';
import {useEffect,useState} from 'react';
import {desktopBridge} from '@/lib/game/platform';
import {useLanguage} from '@/lib/game/i18n';

export function DisplaySettings(){
 const language=useLanguage();
 const tr=(ko:string,en:string,ja:string)=>language==='ko'?ko:language==='ja'?ja:en;
 const [fullscreen,setFullscreen]=useState<boolean|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  const bridge=desktopBridge();
  if(!bridge?.getFullscreen||!bridge.setFullscreen)return;
  let active=true;
  const update=(value:boolean)=>{if(active)setFullscreen(value);};
  const unsubscribe=bridge.onFullscreenChange?.(update);
  void bridge.getFullscreen().then(update).catch(()=>{});
  return()=>{active=false;unsubscribe?.();};
 },[]);
 if(fullscreen===null)return null;
 return <div className="settings-row" data-no-translate>
  <div><strong>{tr('화면 모드','Display mode','画面モード')}</strong>
   <p>{tr('전체 화면으로 시작합니다. F11로도 전환할 수 있어요.','Starts in fullscreen. You can also switch with F11.','全画面で起動します。F11でも切り替えられます。')}</p>
   {error&&<p role="alert">{tr('화면 모드를 바꾸지 못했어요. 다시 시도해 주세요.','Could not change display mode. Please try again.','画面モードを変更できませんでした。もう一度お試しください。')}</p>}
  </div>
  <button className="outline-button" data-testid="display-mode-toggle" aria-pressed={fullscreen} onClick={()=>{
   setError(false);
   void desktopBridge()?.setFullscreen?.(!fullscreen).catch(()=>setError(true));
  }}>{fullscreen?tr('전체 화면','Fullscreen','全画面'):tr('창 모드','Windowed','ウィンドウ')}</button>
 </div>;
}
